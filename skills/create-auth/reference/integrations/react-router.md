---
name: React Router v7
description: Implement production-ready @aura-stack/react-router setup, including Route Handlers, Client Side Rendering, Server Side Rendering. Use this skill when users ask for auth setup in React Router v7 applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/react-router
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/react-router"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly (app/routes/api.auth.$.ts):

```ts
import { handlers } from "~/lib/auth"
import type { Route } from "./+types/api.auth.$"

export const loader = async ({ request }: Route.LoaderArgs) => {
  return handlers.GET(request)
}

export const action = async ({ request }: Route.ActionArgs) => {
  return handlers.ALL(request)
}
```

### 5) Add client helper only when allowed

Create createAuthClient only for client-capable targets.

```ts
import { createAuthClient } from "@aura-stack/react-router/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})

export const { getSession, signIn, signInCredentials, signUp, updateSession, signOut } = authClient
```
