---
name: Vercel Edge Functions
description: Implement production-ready `@aura-stack/auth` setup for Vercel Edge Functions. Use this skill when users ask for auth setup in Vercel Edge Functions.
---

> Aura Auth doesn't provide a built-in Vercel Edge Functions package, so it's recommended to use the core package `@aura-stack/auth`.

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth module

Default module example (api/\_auth.ts):

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly (api/auth/index.ts):

```ts
import { handlers } from "../_auth"

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
