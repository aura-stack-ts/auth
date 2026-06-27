---
name: Express
description: Implement production-ready @aura-stack/express setup, including server setup and middlewares. Use this skill when users ask for auth setup in Express backend applications.
---

## Implementation Steps

### 1) Install Dependencies

Use detected package manager. Example

```bash
pnpm add @aura-stack/express
```

### 2) Create auth module

Default module example (src/lib/auth.ts):

```ts
import { createAuth } from "@aura-stack/express"

export const { toHandler, withAuth, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

Prefer minimal defaults first, then layer advanced options only if user asks.

### 3) Wire route handlers correctly

The handler mount must match basePath exactly ("/auth/\*"):

```ts
import express, { type Express } from "express"
import { toHandler, withAuth } from "@/lib/auth.js"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", toHandler)

app.listen(3000)
```

### 4) Middlewares

The `withAuth` middlewares extracts if there's active session otherwise returns null

```ts
import express, { type Express } from "express"
import { toHandler, withAuth } from "@/lib/auth.js"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", toHandler)

app.get("/api/protected", withAuth, (_, res) => {
  if (!res.locals.session) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  return res.json({
    message: "You have access to this protected resource.",
    session: res.locals.session,
  })
})

app.listen(PORT)
```
