---
name: Astro
description: Implement production-ready @aura-stack/auth setup. Use this skill when users ask for auth setup in Astro applications using the @aura-stack/auth package
---

> Aura Auth doens't provide a built-in astro package, so its recomeded to use the core package @aura-stack/auth.

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/next"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly (src/pages/api/auth/[...all].ts):

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

### 5) Add client helper only when allowed

Create createAuthClient only for client-capable targets.

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})
```
