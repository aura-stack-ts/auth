---
name: create-auth-client
description: Create a @aura-stack/auth client instance (`createAuthClient`) for frameworks that support client-side execution (Next.js, Nuxt, Astro, React Router, TanStack Start, and similar). Use this skill whenever a user asks to set up client auth API usage, sign-in/sign-out client helpers, or frontend auth client wiring. Do not use this skill for server-only frameworks unless the user provides a separate frontend app.
license: MIT
---

# Create Auth Client Instance

Use this skill to implement only the client-side auth API setup.

## Goal

Create a clean `createAuthClient` setup for client-capable frameworks and reject setup for server-only targets unless a separate frontend is provided.

## Required behavior

1. Detect target framework/runtime first.
2. Validate whether client-side code is supported.
3. If supported, create `createAuthClient` with `basePath` and `baseURL`.
4. If not supported, reject and explain why.
5. Offer a correct alternative for server-only systems.

## Framework compatibility gate

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

## Rejection rule

If framework is server-only and no separate frontend app is provided, return:

"I cannot create a `createAuthClient` instance in this target because it is server-only. If you provide your frontend app (for example Next.js, Nuxt, Astro, React, etc.), I can set up the client auth API there."

## Standard implementation

Default client module example:

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})
```

## What to ask before generating code

Collect or confirm:

- Framework name
- Frontend app path
- API `basePath` (default `/api/auth`)
- App base URL for dev/prod

If missing, ask concise follow-up questions.

## Output format

Use this structure:

```markdown
# Auth Client Setup

## 1. Compatibility Check

## 2. Files To Create/Update

## 3. Client Instance Code

## 4. Usage Snippets

## 5. Verification Steps
```

## Usage snippets to include when supported

```ts
await authClient.signIn("github", { redirect: true })
```

```ts
await authClient.signOut({ redirect: true })
```

```ts
const session = await authClient.getSession()
```

## Verification checklist

1. Client can call `signIn` without path errors.
2. Redirect reaches `/api/auth/signin/:provider` route.
3. `getSession` resolves after successful callback.
4. `signOut` clears session state.

## Guardrails

- Do not generate server auth handlers in this skill.
- Do not generate env secrets in this skill.
- Keep changes minimal and framework-conventional.
