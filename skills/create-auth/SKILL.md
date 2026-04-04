---
name: create-basic-auth
description: Set up and implement a basic @aura-stack/auth instance in any runtime or framework (Next.js, Express, Hono, Cloudflare Workers, and similar). Use this skill whenever the user asks for Aura Auth setup, auth route wiring, OAuth provider configuration, environment variables, or a starter auth implementation, even if they do not explicitly mention "skill" or "@aura-stack/auth".
license: MIT
---

# Aura Auth Setup For Any Runtime Or Framework

Use this skill to deliver a complete, practical Aura Auth setup that works across different runtimes and frameworks.

## What this skill must produce

Return all of the following in one response unless the user asks for a subset:

1. A short setup plan tailored to the target stack.
2. Install commands for `@aura-stack/auth` and any framework adapters used.
3. A server auth instance using `createAuth` with a basic provider (default: GitHub).
4. Route wiring for auth handlers on `basePath: "/api/auth"`.
5. Environment variable template with required and optional keys.
6. A minimal client snippet using `createAuthClient` only when the framework supports client-side usage.
7. A verification checklist (sign-in, callback, session, sign-out).

## Inputs to collect first

Ask for missing inputs before writing files:

- Target runtime and framework (Next.js, Express, Hono, Cloudflare Worker, etc.).
- Package manager (`pnpm`, `npm`, `bun`, `yarn`).
- Preferred OAuth provider (default to `github` when unspecified).
- Local URL and deployed URL.
- Whether to include only server setup or server + client integration.

If the user does not specify, proceed with sensible defaults:

- Framework: Next.js App Router.
- Provider: GitHub OAuth.
- Base path: `/api/auth`.
- Local URL: `http://localhost:3000`.

## Secret generation consent flow (mandatory)

Before generating values for `AURA_AUTH_SALT` and `AURA_AUTH_SECRET`, ask the user for permission.

Use this exact question pattern:

"Do you want me to generate secure `AURA_AUTH_SALT` and `AURA_AUTH_SECRET` values now using OpenSSL?"

- If the user accepts: execute the OpenSSL script and provide generated values.
- If the user declines: keep placeholders and explain where to generate values later.

OpenSSL script to execute:

```bash
echo "AURA_AUTH_SALT=\"$(openssl rand -base64 32)\""
echo "AURA_AUTH_SECRET=\"$(openssl rand -base64 32)\""
```

Never run this script without explicit user approval.

## Baseline implementation recipe

### 1) Install

Use the user's package manager. Example:

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth instance

Create a dedicated auth module (for example `src/lib/auth.ts`):

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Use this as the default baseline unless the user asks for custom providers or stricter cookie/session settings.

### 3) Wire route handlers

Pick the matching pattern for the user stack.

Next.js App Router (`src/app/api/auth/[...aura]/route.ts`):

```ts
import { handlers } from "@/lib/auth"

export const { GET, POST, PATCH } = handlers
```

Express (`src/middlewares/auth.ts` + route mount):

```ts
app.use("/api/auth", async (req, res) => {
  const response = await handlers.ALL(toWebRequest(req))
  return toExpressResponse(response, res)
})
```

Hono:

```ts
app.all("/api/auth/*", async (ctx) => {
  return await handlers.ALL(ctx.req.raw)
})
```

Cloudflare Worker:

```ts
if (new URL(request.url).pathname.startsWith("/api/auth/")) {
  return await handlers.ALL(request)
}
```

### 4) Client API compatibility gate

Create `createAuthClient` only if the target framework/runtime supports client-side code execution.

Supports client-side (allow client API):

- Next.js (App Router or Pages Router)
- Nuxt
- Astro
- React Router / TanStack Start

Server-only by default (reject client API creation unless user confirms a separate frontend):

- Express API-only services
- Hono API-only services
- Cloudflare Worker API-only services
- Deno/Bun backend-only services

If unsupported, explicitly reject client API generation and explain:

"This target is server-only, so I will not create a client auth API here. If you have a separate frontend app, I can set up `createAuthClient` there."

### 5) Add client helper (only when supported)

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})
```

Use this for client-side calls like sign-in/sign-out/session retrieval only when the compatibility gate passes.

## Environment variables

Always include this section in your output and adapt provider-specific keys as needed.

Required core values:

```env
# openssl rand -base64 32
AURA_AUTH_SALT=""

# openssl rand -base64 32
AURA_AUTH_SECRET=""
```

If the user approved secret generation, replace these placeholders with generated values and show them once.

Provider values (example: GitHub):

```env
AURA_AUTH_GITHUB_CLIENT_ID=""
AURA_AUTH_GITHUB_CLIENT_SECRET=""
```

Provider key map examples:

- GitHub: `AURA_AUTH_GITHUB_CLIENT_ID`, `AURA_AUTH_GITHUB_CLIENT_SECRET`
- GitLab: `AURA_AUTH_GITLAB_CLIENT_ID`, `AURA_AUTH_GITLAB_CLIENT_SECRET`
- Discord: `AURA_AUTH_DISCORD_CLIENT_ID`, `AURA_AUTH_DISCORD_CLIENT_SECRET`
- Bitbucket: `AURA_AUTH_BITBUCKET_CLIENT_ID`, `AURA_AUTH_BITBUCKET_CLIENT_SECRET`

Never use real secrets in examples and never commit populated `.env` files.

## Basic usage snippets to include

When user asks for "basic auth instance", always include one server snippet.

Include the client snippet only if the framework passes the client API compatibility gate.

Server session check example:

```ts
const session = await api.getSession({
  headers: request.headers,
})
```

Client sign-in example:

```ts
await authClient.signIn("github", { redirect: true })
```

## Validation checklist

After setup, instruct the user (or do it if asked) to verify:

1. `GET /api/auth/session` returns unauthenticated state before login.
2. OAuth sign-in redirects to provider.
3. Callback returns to app and session is available.
4. Sign-out clears session cookie/token.
5. Protected route gate works with `api.getSession`.

## Output format

Use this response structure:

```markdown
# Aura Auth Setup

## 1. Plan

## 2. Install Commands

## 3. Files To Create/Update

## 4. Environment Variables

## 5. How To Verify

## 6. Common Troubleshooting
```

Keep explanations concise, but always explain why each file exists and how it connects to `createAuth` handlers.

## Troubleshooting rules

If auth fails, check these first in this order:

1. `basePath` mismatch between server routes and client config.
2. Missing `AURA_AUTH_SECRET` or `AURA_AUTH_SALT`.
3. OAuth callback URL mismatch in provider dashboard.
4. Missing trusted origin for current host.
5. Wrong proxy/forwarded-header setup in production.

When fixing, prefer minimal edits and preserve user project conventions.
