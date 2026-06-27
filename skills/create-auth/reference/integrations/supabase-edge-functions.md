---
name: Hono
description: Implement production-ready @aura-stack/hono setup, including server setup and middlewares. Use this skill when users ask for auth setup in Hono backend applications.
---

> Aura Auth doens't provide a built-in Cloudflare Worker package, so its recomeded to use the core package @aura-stack/auth.

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/auth
```

### 2) Create auth module

Default module example (functions/_shared_/auth.ts):

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly (functions/auth/index.ts):

```ts
import { handlers } from "../lib/auth"

Deno.serve(async (request) => {
  return await handlers.ALL(request)
})
```
