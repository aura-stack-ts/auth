---
name: Hono
description: Implement production-ready @aura-stack/hono setup, including server setup and middlewares. Use this skill when users ask for auth setup in Hono backend applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/hono
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/hono"

export const { toHandler, withAuth, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly ("/auth/\*"):

```ts
import { Hono } from "hono"
import { toHandler, withAuth } from "@/lib/auth"

const app = new Hono()

app.all("/api/auth/*", toHandler)

export default app
```

### 4) Middlewares

The `withAuth` middlewares extracts if there's active session otherwise returns null

```ts
import { Hono } from "hono"
import { toHandler, withAuth } from "@/lib/auth"

const app = new Hono()

app.all("/auth/*", toHandler)

app.get("/api/protected", withAuth, (ctx) => {
  const session = ctx.get("session")
  if (!session) {
    return ctx.json({ message: "Unauthorized" }, 401)
  }

  return ctx.json({
    message: "You have access to this protected resource.",
    session,
  })
})

export default app
```
