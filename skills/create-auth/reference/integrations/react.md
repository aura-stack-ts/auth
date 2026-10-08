---
name: React
description: Implement production-ready @aura-stack/react setup, including Route Handlers, Client Side Rendering, Server Side Rendering. Use this skill when users ask for auth setup in React applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/react
```

### 2) Create Client Auth module

Default module example (src/lib/auth-client.ts):

```ts
import { createAuthClient } from "@aura-stack/react"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: "https://localhost:3000",
})

export const { getSession, signIn, signInCredentials, signUp, updateSession, signOut } = authClient
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 5) Add server auth instance helper only when allowed

Create createAuth only for client-capable targets. Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/react/server"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```
