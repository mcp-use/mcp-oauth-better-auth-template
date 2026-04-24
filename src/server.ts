/**
 * Better Auth OAuth MCP Server Example
 *
 * Demonstrates running Better Auth and an MCP server on a single Hono app.
 * The auth server and MCP resource server share one port — no separate processes.
 *
 * Setup:
 * 1. Copy .env.example to .env and fill in at least one set of OAuth credentials
 * 2. Run: pnpx auth@latest migrate (creates the database tables)
 * 3. Run: pnpm dev
 * 4. Open MCP Inspector at http://localhost:3000/inspector
 *
 * Environment variables:
 * - BETTER_AUTH_SECRET (required)
 * - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (optional; enables GitHub button)
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (optional; enables Google button)
 */

// @ts-nocheck
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MCPServer, oauthBetterAuthProvider, object } from "mcp-use/server";
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";

import { auth, configuredProviders } from "./auth.js";
import { safeJson } from "./render.js";
import { renderConsentPage, renderSignInPage } from "./views/index.js";

declare const process: { env: Record<string, string | undefined> };

const server = new MCPServer({
  name: "mcp-oauth-better-auth",
  version: "1.0.0",
  description: "MCP server with Better Auth OAuth authentication",
  oauth: oauthBetterAuthProvider({
    authURL: "http://localhost:3000/api/auth",
  }),
});

// ---------------------------------------------------------------------------
// Serve the compiled Tailwind stylesheet
// ---------------------------------------------------------------------------

const stylesCss = readFileSync(
  join(process.cwd(), "public", "styles.css"),
  "utf-8",
);

server.app.get("/styles.css", (c) => {
  return new Response(stylesCss, {
    status: 200,
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

// ---------------------------------------------------------------------------
// Mount Better Auth on the MCP server's Hono app
// ---------------------------------------------------------------------------

// Handle all Better Auth API routes
server.app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// Mount .well-known/oauth-authorization-server metadata
// RFC 8414 uses path insertion: /.well-known/oauth-authorization-server{issuer-path}
// We mount at both the root (fallback) and the spec-compliant path.
// CORS headers needed for browser-based MCP clients (e.g. MCP Inspector).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};
const authServerMetadataHandler = oauthProviderAuthServerMetadata(auth, {
  headers: corsHeaders,
});
server.app.get("/.well-known/oauth-authorization-server", async (c) => {
  return authServerMetadataHandler(c.req.raw);
});
server.app.get(
  "/.well-known/oauth-authorization-server/api/auth",
  async (c) => {
    return authServerMetadataHandler(c.req.raw);
  },
);

// Mount .well-known/openid-configuration metadata
// Required because the openid scope is supported.
// RFC 8414 path insertion: /.well-known/openid-configuration{issuer-path}
const openIdConfigHandler = oauthProviderOpenIdConfigMetadata(auth, {
  headers: corsHeaders,
});
server.app.get("/.well-known/openid-configuration", async (c) => {
  return openIdConfigHandler(c.req.raw);
});
server.app.get("/.well-known/openid-configuration/api/auth", async (c) => {
  return openIdConfigHandler(c.req.raw);
});

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

server.app.get("/sign-in", (c) => {
  // Forward OAuth query params so the authorize step can continue after login.
  const queryString = new URL(c.req.url).search;
  const callbackURL = "/api/auth/oauth2/authorize" + queryString;

  const signInScript = `
(function () {
  const CALLBACK_URL = ${safeJson(callbackURL)};
  const ENABLED = ${safeJson(configuredProviders)};
  const buttons = document.querySelectorAll('[data-provider]');
  buttons.forEach(function (btn) {
    if (!ENABLED.includes(btn.dataset.provider)) {
      btn.disabled = true;
      btn.title = 'Set ' + btn.dataset.provider.toUpperCase() + '_CLIENT_ID / _SECRET in .env to enable';
    }
    btn.addEventListener('click', async function () {
      buttons.forEach(function (b) { b.disabled = true; });
      try {
        const res = await fetch('/api/auth/sign-in/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ provider: btn.dataset.provider, callbackURL: CALLBACK_URL }),
        });
        const data = await res.json();
        if (data && data.url) { window.location.href = data.url; return; }
        throw new Error((data && data.message) || 'Sign-in failed');
      } catch (err) {
        buttons.forEach(function (b) { b.disabled = false; });
        const msg = document.getElementById('signin-error');
        if (msg) msg.textContent = String((err && err.message) || err);
      }
    });
  });
})();
`;

  return c.html(renderSignInPage({ signInScript }));
});

// ---------------------------------------------------------------------------
// Consent page — allows user to approve requested scopes
// ---------------------------------------------------------------------------

server.app.get("/consent", (c) => {
  const url = new URL(c.req.url);
  const clientId = url.searchParams.get("client_id") || "Unknown client";
  const scope = url.searchParams.get("scope") || "openid";
  const scopes = scope.split(" ").filter(Boolean);

  const consentScript = `
(function () {
  const buttons = document.querySelectorAll('[data-consent]');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', async function () {
      buttons.forEach(function (b) { b.disabled = true; });
      try {
        const res = await fetch('/api/auth/oauth2/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            accept: btn.dataset.consent === 'approve',
            oauth_query: window.location.search.slice(1),
          }),
        });
        const data = await res.json();
        if (data && data.url) { window.location.href = data.url; return; }
        throw new Error((data && data.message) || 'Consent failed');
      } catch (err) {
        buttons.forEach(function (b) { b.disabled = false; });
        const msg = document.getElementById('consent-error');
        if (msg) msg.textContent = String((err && err.message) || err);
      }
    });
  });
})();
`;

  return c.html(
    renderConsentPage({
      clientName: clientId,
      scopes,
      consentScript,
    }),
  );
});

// ---------------------------------------------------------------------------
// MCP Tools
// ---------------------------------------------------------------------------

/**
 * Tool that returns authenticated user information from the JWT
 */
server.tool(
  {
    name: "get-user-info",
    description: "Get information about the authenticated user",
  },
  async (_args, ctx) =>
    object({
      userId: ctx.auth.user.userId,
      email: ctx.auth.user.email,
      name: ctx.auth.user.name,
      scopes: ctx.auth.scopes,
      permissions: ctx.auth.permissions,
    }),
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen({ port: 3000 }).then(() => {
  console.log("Better Auth OAuth MCP Server running on http://localhost:3000");
  console.log("MCP Inspector: http://localhost:3000/inspector");
  console.log("Auth API: http://localhost:3000/api/auth");
  if (configuredProviders.length === 0) {
    console.warn(
      "⚠  No social providers configured. Set GITHUB_CLIENT_ID/SECRET or GOOGLE_CLIENT_ID/SECRET in .env",
    );
  } else {
    console.log("Providers enabled:", configuredProviders.join(", "));
  }
});
