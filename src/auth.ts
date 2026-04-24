/**
 * Better Auth Configuration
 *
 * Sets up a Better Auth instance with:
 * - No database (sessionless/stateless mode — sessions stored in signed cookies)
 * - Google + GitHub social login (either can be omitted in .env)
 * - OAuth Provider plugin (for MCP OAuth flows)
 * - JWT plugin (required by OAuth Provider for token signing/verification)
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";

declare const process: { env: Record<string, string | undefined> };

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const configuredProviders = Object.keys(socialProviders) as Array<
  "github" | "google"
>;

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  socialProviders,
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      // MCP clients send the resource URL from /.well-known/oauth-protected-resource
      // as the token request's `resource` parameter. Better Auth validates it against
      // this list. Include the /mcp path.
      validAudiences: ["http://localhost:3000/mcp"],
      // Include user profile claims in the access token JWT so
      // ctx.auth.user.email / .name / .picture are available in MCP tools.
      // Without this, Better Auth only includes standard claims (sub, iss, scope, etc.).
      customAccessTokenClaims: async ({ user }) => ({
        email: user?.email,
        name: user?.name,
        picture: user?.image,
      }),
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
    }),
  ],
});
