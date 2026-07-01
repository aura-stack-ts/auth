---
name: Cloudflare Workers
description: Implement production-ready `@aura-stack/auth` setup for Cloudflare Workers. Use this skill when users ask for auth setup in Cloudflare Workers.
---

> Aura Auth doesn't provide a built-in Cloudflare Worker package, so it's recommended to use the core package `@aura-stack/auth`.

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

The handler mount must match basePath exactly (e.g., `src/index.ts` or `functions/auth/[[path]].ts`):

```ts
import { handlers } from "../lib/auth"

export default {
  async fetch(request): Promise<Response> {
    return await handlers.ALL(request)
  },
} satisfies ExportedHandler<Env>
```
