---
name: TanStack React Start
description: Implement production-ready @aura-stack/auth setup. Use this skill when users ask for auth setup in TanStack React Start applications using the @aura-stack/auth package
---

> Aura Auth doesn't provide a built-in TanStack React Start package, so it's recommended to use the core package `@aura-stack/auth`.

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

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

The handler mount must match basePath exactly (src/routes/api/auth.$.ts):

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

### 5) Add client helper only when allowed

Create createAuthClient only for client-capable targets.

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})

export const { getSession, signIn, signInCredentials, signUp, updateSession, signOut } = authClient
```
