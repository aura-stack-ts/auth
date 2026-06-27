---
name: Elysia
description: Implement production-ready @aura-stack/elysia setup, including server setup and middlewares. Use this skill when users ask for auth setup in Elysia backend applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/elysia
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/elysia"

export const { toHandler, withAuth, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly ("/auth/\*"):

```ts
import { Elysia } from "elysia"
import { toHandler } from "@/lib/auth"

const app = new Elysia()

app.all("/api/auth/*", toHandler)

app.listen(3000)
```

### 4) Middlewares

The `withAuth` middlewares extracts if there's active session otherwise returns null

```ts
import { Elysia } from "elysia"
import { toHandler, withAuth } from "@/lib/auth"

const app = new Elysia()

app.get("/", () => "Welcome to the Aura Auth Elysia App!")

app.all("/api/auth/*", toHandler)

app.derive(withAuth).get("/api/protected", (ctx) => {
  if (!ctx.session) {
    return Response.json(
      {
        error: "Unauthorized",
        message: "Active session required.",
      },
      { status: 401 }
    )
  }
  return Response.json({
    message: "You have access to this protected resource.",
    session: ctx?.session,
  })
})

app.listen(3000)
```
