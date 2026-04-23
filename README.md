# MCP OAuth — Better Auth

<p>
  <a href="https://github.com/mcp-use/mcp-use">Built with <b>mcp-use</b></a>
  &nbsp;
  <a href="https://github.com/mcp-use/mcp-use">
    <img src="https://img.shields.io/github/stars/mcp-use/mcp-use?style=social" alt="mcp-use stars">
  </a>
</p>

A self-hosted MCP server template that runs **Better Auth** as the OAuth authorization server on the same Hono app — no separate auth service, no external auth provider, just one Node process. GitHub social login is wired up out of the box.

## Features

- **Self-hosted OAuth 2.1 server** — Better Auth's `@better-auth/oauth-provider` plugin
- **Single-process** — auth server and MCP resource server share one port
- **GitHub social login** — pre-wired example, swap for any provider Better Auth supports
- **Stateless sessions** — no database required for the demo (sessions are signed cookies); plug in a database for production
- **JWT-signed access tokens** — verified by `oauthBetterAuthProvider()` in mcp-use
- **Custom JWT claims** — user email/name/picture exposed to MCP tools via `ctx.auth.user`

## Prerequisites

1. **Node.js 20+** (22 recommended)
2. **pnpm 10+**
3. **GitHub OAuth app** — create one at <https://github.com/settings/developers>
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## Setup

### 1. Configure environment variables

Copy `.env.example` to `.env` and fill in your GitHub OAuth credentials:

```bash
cp .env.example .env
```

```bash
BETTER_AUTH_SECRET=<long-random-string>     # generate with: openssl rand -base64 32
GITHUB_CLIENT_ID=<from github oauth app>
GITHUB_CLIENT_SECRET=<from github oauth app>
```

### 2. Install and run

```bash
pnpm install
pnpm dev
```

This starts:

- The MCP server on port **3000**
- The Better Auth API at <http://localhost:3000/api/auth>
- The MCP Inspector at <http://localhost:3000/inspector>

## Try it out

1. Open <http://localhost:3000/inspector>
2. Connect to `http://localhost:3000/mcp`
3. The inspector triggers OAuth — you'll be redirected to `/sign-in`
4. Click **Sign in with GitHub**, complete GitHub's flow
5. Approve the requested scopes on the consent page
6. Call `get-user-info` to see your authenticated user data

## Available tools

| Tool            | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `get-user-info` | Returns user info (id, email, name, scopes, permissions) from the JWT |

## How the OAuth flow works

Better Auth and your MCP server live in the same process. Better Auth handles `/authorize`, `/token`, `/register` and well-known metadata. Your code only renders the sign-in and consent pages.

```
MCP Client ──(1) MCP request without token ─▶ MCP Server ──▶ 401 + WWW-Authenticate
MCP Client ──(2) GET /.well-known/oauth-protected-resource ─▶ MCP Server
MCP Client ──(3) GET /.well-known/oauth-authorization-server ─▶ MCP Server (Better Auth)
MCP Client ──(4) Dynamic Client Registration ─▶ MCP Server (Better Auth)
MCP Client ──(5) Authorization redirect ─▶ /sign-in ──▶ GitHub ──▶ /consent
MCP Client ──(6) Token exchange ─▶ MCP Server (Better Auth) — issues JWT
MCP Client ──(7) MCP request + Bearer <jwt> ─▶ MCP Server (verifies via Better Auth JWKS)
```

## Customizing

### Add a database

The demo runs in stateless mode (signed-cookie sessions). For production, add a Better Auth-supported database adapter — see the [Better Auth database docs](https://www.better-auth.com/docs/concepts/database).

### Swap the social provider

Edit `src/auth.ts` to add Google, Discord, etc. — see the [Better Auth social providers](https://www.better-auth.com/docs/authentication/social) reference.

### Add custom JWT claims

The `customAccessTokenClaims` callback in `src/auth.ts` already adds `email`, `name`, and `picture`. Add fields here to expose more user data through `ctx.auth.user` in your tools.

### Restrict audiences

`validAudiences` in `src/auth.ts` controls which `resource` parameters Better Auth will issue tokens for. Add your production MCP URL there before deploying.

## Deploy

```bash
npx mcp-use deploy
```

Before deploying:

1. Set `BETTER_AUTH_SECRET` to a strong random value (production secret manager).
2. Update the `baseURL` in `src/auth.ts` and `validAudiences` to your production hostname.
3. Update the GitHub OAuth app callback URL to match.
4. Wire in a real database adapter (see above).

## Troubleshooting

- **Login redirects loop / cookies don't stick** — make sure `baseURL` in `src/auth.ts` matches the host the browser is hitting (including scheme and port).
- **`invalid_audience` from Better Auth on token exchange** — your client is sending a `resource` URL that isn't in `validAudiences`. Add it.
- **GitHub callback errors** — confirm the GitHub OAuth app's callback URL is exactly `http://<your-host>/api/auth/callback/github`.

## Learn more

- [Better Auth docs](https://www.better-auth.com/docs)
- [`@better-auth/oauth-provider`](https://www.better-auth.com/docs/plugins/oauth-provider)
- [mcp-use docs](https://mcp-use.com/docs)
- [MCP Authorization spec](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)

## License

MIT
