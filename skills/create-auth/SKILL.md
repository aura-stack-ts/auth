---
name: create-auth
description: Implement production-ready @aura-stack/auth server setup for any supported runtime and framework (Next.js, Express, Hono, Cloudflare Workers, and similar), including route wiring, provider config, environment strategy, and verification flow. Use this skill whenever users ask for auth setup, starter auth wiring, OAuth login integration, auth route problems, or env configuration, even if they do not explicitly mention @aura-stack/auth.
license: MIT
---

# Create Aura Auth Server Setup

Use this skill to deliver a complete, reliable, framework-aware Aura Auth implementation.

Docs home: https://aura-stack-auth.vercel.app/docs/

---

## When to use

Use this skill whenever the user asks for Aura Auth setup, auth route wiring, OAuth provider configuration, environment variables, or a starter auth implementation, even if they do not explicitly mention "skill" or "@aura-stack/auth".

---

## Output Contract (Strict)

Always return ALL of the following unless explicitly scoped otherwise:

1. Setup plan customized to detected runtime and framework.
2. Correct install commands for package manager and adapters.
3. Auth instance (`createAuth`)
4. Route wiring at `basePath` (default `/api/auth`).
5. Route handler wiring
6. Environment variable template with required and optional keys.
7. Secret-generation guidance with explicit consent workflow.
8. Environment variables (template + explanation)
9. Client helper snippet only when target supports client code.
10. Verification checklist
11. Troubleshooting section

---

## What this skill must produce

Return all of the following in one response unless the user asks for a subset:

1. A short setup plan tailored to the target stack.
2. Install commands for `@aura-stack/auth` and any framework adapters used.
3. A server auth instance using `createAuth` with a basic provider (default: GitHub).
4. Route wiring for auth handlers on `basePath: "/api/auth"`.
5. Defined environment variables with placeholders and instructions for generating secrets.
6. Environment variable template with required and optional keys.
7. A minimal client snippet using `createAuthClient` only when the framework supports client-side usage.
8. A verification checklist (sign-in, callback, session, sign-out).

---

## Instructions

### Mandatory Preflight Discovery (Required)

Before writing files, collect or detect:

1. Runtime/framework:
   - Read project indicators (package.json, deno.json, framework config files).
   - If multiple frameworks are found, ask user to choose primary auth host.
2. Package manager from lockfile:
   - `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`.
3. OAuth provider target:
   - Default to `github` when unspecified.
4. Local and deployment URLs:
   - Default local to http://localhost:3000 if unknown.
5. Scope:
   - Server-only setup or server + client helper.

If critical inputs are missing and cannot be inferred, ask concise follow-up questions before writing code.

### Secret generation consent flow (mandatory)

Before generating secrets, ask:

> "Do you want me to generate secure `AURA_AUTH_SALT` and `AURA_AUTH_SECRET` values now?"

- If user accepts: run a generation command and return values once.
- If user declines: keep placeholders and explain where to generate later.

Idempotent `.env` updater script: see [scripts/update-auth-env.sh](scripts/update-auth-env.sh).

Run it with: [script](./scripts/update-auth-env.sh)

Never auto-generate without consent. Always ask first and explain the benefits of using generated secrets.

---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example:

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly.

Next.js App Router (src/app/api/auth/[...aura]/route.ts):

```ts
import { handlers } from "@/lib/auth"

export const { GET, POST, PATCH } = handlers
```

Next.js Pages Router:

```ts
import { handlers } from "@/lib/auth"
export default async function handler(req, res) {
  const response = await handlers.ALL(req)
  res.status(response.status).set(response.headers).send(response.body)
}
```

Astro:

```ts
import { handlers } from "@/lib/auth"

import type { APIRoute } from "astro"

export const GET: APIRoute = async ({ request }) => {
  return await handlers.GET(request)
}

export const POST: APIRoute = async ({ request }) => {
  return await handlers.POST(request)
}
```

React Router:

```ts
import { handlers } from "~/lib/auth"
import type { Route } from "./+types/api.auth.$"

export const loader = async ({ request }: Route.LoaderArgs) => {
  return handlers.GET(request)
}

export const action = async ({ request }: Route.ActionArgs) => {
  return handlers.POST(request)
}
```

TanStack Start:

```ts
import { handlers } from "@/lib/auth"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return await handlers.GET(request)
      },
      POST: async ({ request }) => {
        return await handlers.POST(request)
      },
      PATCH: async ({ request }) => {
        return await handlers.PATCH(request)
      },
    },
  },
})
```

Express:

```ts
app.use("/api/auth", async (req, res) => {
  const response = await handlers.ALL(toWebRequest(req))
  return toExpressResponse(response, res)
})
```

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

Elysia:

```ts
import { handlers } from "@/lib/auth"
import type { Context } from "elysia"

app.all("/api/auth/*", handlers.ALL)
```

Cloudflare Worker:

```ts
if (new URL(request.url).pathname.startsWith("/api/auth/")) {
  return await handlers.ALL(request)
}
```

Deno or Supabase Edge Function:

```ts
import { handlers } from "@/lib/auth"
Deno.serve(async (request) => {
  const pathname = new URL(request.url).pathname
  if (pathname.startsWith("/api/auth/")) {
    return await handlers.ALL(request)
  }
})
```

Vercel Edge Function:

```ts
import { handlers } from "@/lib/_auth"

export const GET = async (request: Request) => {
  return await handlers.GET(request)
}

export const POST = async (request: Request) => {
  return await handlers.POST(request)
}

export const PATCH = async (request: Request) => {
  return await handlers.PATCH(request)
}
```

### 4) Client compatibility gate

Create createAuthClient only for client-capable targets.

Client-capable:

- Next.js
- Nuxt
- Astro
- React Router
- TanStack Start

Server-only by default:

- Express API-only
- Hono API-only
- Cloudflare Worker API-only
- Deno/Bun backend-only

If server-only, respond with:

This target is server-only, so I will not create a client auth API here. If you have a separate frontend app, I can set up createAuthClient there.

### 5) Add client helper only when allowed

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})
```

---

## Environment Variables Section (Always Include)

Core required keys:

```env
# generate securely (do not commit real values)
AURA_AUTH_SALT=""
AURA_AUTH_SECRET=""
```

Provider keys (GitHub example):

```env
AURA_AUTH_GITHUB_CLIENT_ID=""
AURA_AUTH_GITHUB_CLIENT_SECRET=""
```

Provider key map examples:

- GitHub: AURA_AUTH_GITHUB_CLIENT_ID, AURA_AUTH_GITHUB_CLIENT_SECRET
- GitLab: AURA_AUTH_GITLAB_CLIENT_ID, AURA_AUTH_GITLAB_CLIENT_SECRET
- Discord: AURA_AUTH_DISCORD_CLIENT_ID, AURA_AUTH_DISCORD_CLIENT_SECRET
- Bitbucket: AURA_AUTH_BITBUCKET_CLIENT_ID, AURA_AUTH_BITBUCKET_CLIENT_SECRET

Security requirements:

- Never print real secrets unless user explicitly asked to generate them now.
- Never commit populated .env files.
- Ensure .env is ignored by .gitignore.
- Keep .env.example placeholders only.

---

## Usage Snippets to Include

Always include one server-side session example:

```ts
const session = await api.getSession({
  headers: request.headers,
})
```

If client helper is created, include at least one client action:

```ts
await authClient.signIn("github", { redirect: true })
```

---

## Quality Bar

Every answer generated with this skill must be:

1. Correct for the detected framework routing model.
2. Minimal in code changes and aligned with user conventions.
3. Explicit about why each created file exists.
4. Safe about secrets and environment handling.
5. Actionable to run without extra hidden assumptions.

---

## Output Template (Use This Structure)

```markdown
# Aura Auth Setup

## 1. Stack Detection and Plan

## 2. Install Commands

## 3. Files To Create or Update

## 4. Environment Variables

## 5. Verification Checklist

## 6. Troubleshooting (Ordered)
```

---

## Verification Checklist

1. GET /api/auth/session returns unauthenticated state before login.
2. Provider sign-in route redirects correctly.
3. Callback returns to app and session becomes available.
4. Sign-out clears auth session artifacts.
5. Protected route/session gate works with api.getSession.

---

## Troubleshooting Order

Check in this sequence:

1. basePath mismatch between auth instance, route mount, and client helper.
2. Missing or malformed AURA_AUTH_SECRET and AURA_AUTH_SALT.
3. OAuth callback URL mismatch in provider dashboard.
4. Missing trusted origin or wrong host configuration.
5. Proxy forwarding/header mismatch in production.

---

## Guardrails

- Do not invent framework-specific APIs that are not standard for that stack.
- Do not add advanced auth config unless user asks or risk requires it.
- Do not expose or persist secrets in committed files.
- Do not generate client-only setup for server-only targets.
- Prefer small, reversible edits over large rewrites.

When fixing, prefer minimal edits and preserve user project conventions.
