---
name: create-auth-client
description: Create a @aura-stack/auth client instance (`createAuthClient`) for frameworks that support client-side execution (Next.js, Nuxt, Astro, React Router, TanStack Start, and similar). Use this skill whenever a user asks to wire client auth helpers, sign-in/sign-out flows, or frontend session calls. Do not use this skill for server-only frameworks unless the user provides a separate frontend app.
license: MIT
---

# Create Auth Client Instance

Use this skill to implement only the client-side auth API setup for Aura Auth.

Docs home: https://aura-stack-auth.vercel.app/docs/

---

## Goal

Create a correct, minimal `createAuthClient` setup for client-capable frameworks, and reject setup for server-only targets unless a separate frontend app is provided.

---

## When to use

Use this skill whenever the user asks to set up client auth API usage, sign-in/sign-out client helpers, session reads, or frontend auth client wiring in a client-capable framework.

---

## Output Contract (Strict)

Always return ALL of the following unless explicitly scoped otherwise:

1. Setup plan customized to the detected framework and project structure.
2. Clear rejection with explanation if the target is server-only without a separate frontend.
3. Correct `createAuthClient` code snippet when supported.
4. `baseURL` and `basePath` matched to the existing `createAuth` instance when one is present.
5. Sensible defaults when the auth host cannot be detected: `basePath: "/api/auth"`, `baseURL: "http://localhost:3000"`.
6. Environment variable template with required and optional keys.
7. Secret-generation guidance with explicit consent workflow, limited to telling the user how to prepare server-side secrets.
8. Usage snippets for supported client methods.
9. Verification checklist.

---

## What this skill must produce

Return all of the following in one response unless the user asks for a subset:

1. A short, step-by-step setup plan customized to the user's framework and project structure.
2. A correct `createAuthClient` code snippet for the detected framework when supported.
3. A clear rejection with explanation if the target is server-only without a separate frontend.
4. Environment variable guidance for the client and the backend it depends on.
5. Secret-generation guidance with explicit consent workflow.
6. Minimal usage snippets for supported client methods (`signIn`, `signOut`, `getSession`, `updateSession`).
7. A verification checklist to confirm correct setup after implementation.

---

## Rejection rule

If framework is server-only and no separate frontend app is provided, return:

> "I cannot create a `createAuthClient` instance in this target because it is server-only. If you provide your frontend app (for example Next.js, Nuxt, Astro, React, or another client-capable app), I can set up the client auth API there."

---

## Instructions

### Mandatory Preflight Discovery (Required)

Before writing files, collect or detect:

1. Framework:
   - Read project indicators (package.json, deno.json, framework config files).
   - If multiple frameworks are found, ask user to choose the primary auth host.

2. Find the existing auth instance by searching for `createAuth` so the client can reuse its `baseURL` and `basePath`.
3. Read env variables from `.env` or similar files to detect existing auth-related config.
4. If secrets are not found, ask whether the user wants guidance for generating secure server-side secrets.
5. If framework is server-only and no separate frontend app is provided, reject with explanation.

### Framework compatibility gate

Treat these as client-capable by default:

- Next.js (App Router and Pages Router)
- Nuxt
- Astro
- React Router
- TanStack Start
- Any framework with browser/client bundle support

Treat these as server-only by default:

- Express API-only apps
- Hono API-only apps
- Cloudflare Worker API-only apps
- Bun or Deno backend-only services

---

## Implementation Steps

### 1) Confirm host settings

Use the detected auth host when present. If not found, ask for confirmation and fall back to:

- `basePath: "/api/auth"`
- `baseURL: "http://localhost:3000"`

If the app uses a public runtime variable for the frontend host, map it to the same values instead of hard-coding duplicates.

### 2) Create the client API module

Default client module example:

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  basePath: "/api/auth",
})
```

Typical file locations:

- Next.js: `src/lib/auth-client.ts`
- Nuxt: `app/lib/auth-client.ts`
- Astro: `src/lib/auth-client.ts`
- React Router: `app/lib/auth-client.ts`
- TanStack Start: `src/lib/auth-client.ts`

### 3) Show supported client usage

Include the smallest useful snippets for the target framework:

```ts
await authClient.signIn("github", {
  redirectTo: "https://yourapp.com/dashboard",
})
```

```ts
await authClient.signOut({
  redirectTo: "https://yourapp.com",
})
```

```ts
const session = await authClient.getSession()
```

```ts
const updatedSession = await authClient.updateSession({
  user: {
    name: "New Name",
  },
})
```

### 4) Explain environment variables

Separate client settings from server settings.

Client-side values are optional if the host is hard-coded in the module:

```bash
PUBLIC_AURA_AUTH_BASE_URL="http://localhost:3000"
PUBLIC_AURA_AUTH_BASE_PATH="/api/auth"
```

Server-side values must already exist in the auth backend project:

```bash
AURA_AUTH_SECRET="..."
AURA_AUTH_SALT="..."
AURA_AUTH_GITHUB_CLIENT_ID="..."
AURA_AUTH_GITHUB_CLIENT_SECRET="..."
```

### 5) Secret-generation guidance

Do not generate secrets inside this skill.

If secrets are missing, ask:

> "Do you want guidance for generating secure `AURA_AUTH_SECRET` and `AURA_AUTH_SALT` values in the server project?"

If the user agrees, point them to the server auth setup skill or the repo helper script used to update `.env` values.

### 6) Reject server-only targets cleanly

If the runtime cannot run client code, stop and explain that the user needs a separate frontend app before `createAuthClient` can be added.

## Output format

Use this structure:

```markdown
# Auth Client Setup

## 1. Compatibility Check

## 2. Files To Create/Update

## 3. Client Instance Code

## 4. Usage Snippets

## 5. Environment Variables

## 6. Verification Steps
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

## Verification Checklist

1. Client can call `signIn` without path errors.
2. Redirect reaches `/api/auth/signin/:provider` route.
3. `getSession` resolves after successful callback.
4. `signOut` clears session state.
5. `baseURL` and `basePath` match the server auth instance.

---

## Guardrails

- Do not generate server auth handlers in this skill.
- Do not generate env secrets in this skill.
- Do not duplicate the server auth setup skill.
- Keep changes minimal and framework-conventional.
