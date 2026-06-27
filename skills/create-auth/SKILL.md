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

Always return ALL of the following unless explicitly scoped otherwise. If the user asks for a subset, produce only the requested pieces.

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

1. Runtime / framework detection (priority order):
   - Inspect `package.json`, `deno.json`, `wrangler.jsonc`, `next.config.ts`, `astro.config.mjs`, `tsconfig.json` and `apps/*` folders.
   - If adapters appear in `packages/` (e.g., `packages/next`, `packages/express`, `packages/astro`) prefer those conventions.
   - If multiple runtime candidates are present, ask: "Which runtime should host auth (e.g., nextjs, express, cloudflare)?"
2. Package manager and install command:
   - Check `pnpm-lock.yaml`, `pnpm-workspace.yaml` -> use `pnpm`.
   - Check `package-lock.json` -> use `npm`.
   - Check `yarn.lock` -> use `yarn`.
   - Check `bun.lockb` or `bun` in `engines` -> use `bun`.
3. OAuth provider(s):
   - Default to `github` if not specified. Ask which providers they want when not obvious.
4. Local and production base URLs:
   - Default local to `http://localhost:3000`. Ask for deployed host if known (e.g., Vercel, Cloudflare, Supabase).
5. Scope and client-side needs:
   - Ask whether the repository contains a frontend that should receive `createAuthClient` snippets.

Follow-up questions should be minimal and only when necessary (two short questions maximum recommended).

### Secret generation consent flow (mandatory)

Always ask before generating or printing real secrets.

Ask: "Do you want me to generate secure `AURA_AUTH_SALT` and `AURA_AUTH_SECRET` values now?"

- If the user accepts: generate secure values locally (explain the generation method) and paste them once in the response. Also print an `export`/`.env` snippet and recommend copying to a secure vault.
- If the user declines: leave placeholders in the templates and point to `scripts/update-auth-env.sh` for a safe, idempotent local updater.

Never generate or commit secrets without explicit user consent.

---

Only official adapter packages should be recommended when available. For unsupported adapters recommend using the `@aura-stack/auth` core package plus a minimal adapter shim with clear examples.

The repo contains many `packages/*` adapters — prefer their conventions when wiring routes and examples.

## Implementation Steps

### 1) Install Dependencies

Use the detected package manager. Example (pnpm detected in this repo):

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth module

Default module example (server source path depending on framework, e.g. `src/lib/auth.ts`):

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

For more detials about createAuth function read [createAuth Reference](./reference/create-auth.md)

### 4) Client compatibility gate

Only add `createAuthClient` when the detected target includes a frontend runtime that will call the auth endpoints directly (Next.js app, Astro, React app, etc.).

If the project is API-only (Express, Hono, Cloudflare Worker, standalone Deno/Bun service), do not generate client code — instead output a concise note explaining how to integrate a separate frontend.

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

Security requirements:

- Never print real secrets unless the user explicitly asks to generate them now.
- Never commit populated `.env` files.
- Ensure `.env` is ignored by `.gitignore`.
- Keep `.env.example` placeholders only.

---

## Usage Snippets to Include

Always include one server-side session example:

```ts
const session = await api.getSession({
  headers: request.headers,
})
```

If client helper is created, include at least one client action:

If client helper is created, include at least one client action:

```ts
await authClient.signIn("github", { redirect: true })
```

---

## Quality Bar

Every answer generated with this skill must be:

Every answer generated with this skill must be:

1. Correct for the detected framework routing model and use the repository's adapter conventions when present.
2. Minimal in code changes and aligned with user conventions.
3. Explicit about why each created or modified file exists and where to place it.
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

## createAuth Configuration Options (Summary)

When producing `createAuth` examples, include and explain the most common configuration options. For full details, link to the detailed reference: [reference/create-auth.md](reference/create-auth.md).

- `oauth`: Array of built-in provider IDs or full provider configs (e.g., `"github"` or `{ id: "custom", authorize: { url: "..." }, clientId, clientSecret }`). See provider examples in [reference/create-auth.md](reference/create-auth.md#oauth).
- `session`: Session strategy and JWT settings (strategy: `"jwt"` or others, `jwt.mode`, `jwt.maxAge`). Default recommendation: sealed JWT with 7-day expiry.
- `secret`: Cryptographic secret or keys; prefer environment variables `AURA_AUTH_SECRET` / `AUTH_SECRET` and ask for consent before generating.
- `cookies`: `prefix`, `overrides` for individual cookie names and strategies (`secure`, `host`, `standard`). Link to cookie guidance in [reference/create-auth.md](reference/create-auth.md#cookies).
- `basePath`: Mount path for auth routes (default `/auth`). Ensure route handlers match this path exactly — see each integration doc.
- `baseURL`: Public application URL for redirect construction; recommend setting in production.
- `identity`: Identity schema and validation options (`schema`, `skipValidation`, `unknownKeys`). See identity docs in [reference/create-auth.md](reference/create-auth.md#identity-schema).
- `credentials`: Credentials provider for username/password flows (authorize handler, hashing helpers).
- `signUp`: Sign-up flow configuration and callbacks for user creation.
- `rateLimiter`: Rate limiting rules for auth endpoints.
- `trustedOrigins` & `trustedProxyHeaders`: Configure redirect validation and proxy awareness (use carefully).
- `logger`: `true` or custom logger implementing Aura Auth `Logger` interface.

When generating examples for a specific framework, link to the integration guide under `reference/integrations/` (examples below).

## Integration Guides (quick links)

- Astro: [reference/integrations/astro.md](reference/integrations/astro.md)
- Next.js App Router: [reference/integrations/nextjs-app-router.md](reference/integrations/nextjs-app-router.md)
- Next.js Pages Router: [reference/integrations/nextjs-pages-router.md](reference/integrations/nextjs-pages-router.md)
- Express: [reference/integrations/express.md](reference/integrations/express.md)
- Elysia: [reference/integrations/elysia.md](reference/integrations/elysia.md)
- Hono: [reference/integrations/hono.md](reference/integrations/hono.md)
- React: [reference/integrations/react.md](reference/integrations/react.md)
- React Router: [reference/integrations/react-router.md](reference/integrations/react-router.md)
- Cloudflare Workers: [reference/integrations/cloudflare-workers.md](reference/integrations/cloudflare-workers.md)
- Vercel Edge Functions: [reference/integrations/vercel-edge-functions.md](reference/integrations/vercel-edge-functions.md)
- Supabase Edge Functions: [reference/integrations/supabase-edge-functions.md](reference/integrations/supabase-edge-functions.md)
- TanStack Start: [reference/integrations/tanstack-start.md](reference/integrations/tanstack-start.md)

Include the relevant integration link in every response when the framework is detected.

## Example Prompts

- "Set up Aura Auth for my Next.js app with GitHub and Google providers, using pnpm."
- "Add auth handlers to `apps/astro` and create a client helper in `apps/astro/src/client.ts`."
- "I want an Express API-only auth server; don't generate client code."

## Iteration & Delivery

1. Draft: produce the plan and code snippets.
2. Ask the user for missing inputs (provider, host, consent for secrets).
3. Apply changes (create files) only after confirmation.
4. Run a light verification checklist and update until green.

## Suggested Next Customizations

- Add a `create-auth` generator script (`bin/create-auth`) to scaffold files automatically.
- Add framework-specific tests under `packages/*/test` to verify example routes.
- Create `docs/content/docs/examples/auth-quickstart.mdx` with copy-paste examples for the most common stacks.

---

References used from the repository: `packages/` adapter folders and `docs/content/docs` examples.

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
