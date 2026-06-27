---
name: Next.js Pages Router
description: Implement production-ready @aura-stack/next setup, including Route Handlers, Client Side Rendering, Server Side Rendering. Use this skill when users ask for auth setup in Next.js Pages Router applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/next
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/next/pages"

export const { toHandler, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly (src/pages/auth/[...aura].ts):

```ts
import { toHandler } from "@/lib/auth"

export default toHandler
```

### 5) Add client helper only when allowed

Create createAuthClient only for client-capable targets.

```ts
import { createAuthClient } from "@aura-stack/next/pages/client"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})

export const { getSession, signIn, signInCredentials, signUp, updateSession, signOut } = authClient
```
