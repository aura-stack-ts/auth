<div align="center">
  
<h1><b>@aura-stack/hono</b></h1>

**Hono middleware and utilities for the Aura Stack authentication library**

[![npm version](https://img.shields.io/npm/v/@aura-stack/hono.svg)](https://www.npmjs.com/package/@aura-stack/hono)
[![JSR version](https://jsr.io/badges/@aura-stack/hono)](https://jsr.io/@aura-stack/hono)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Hono Package Docs](https://aura-stack-auth.vercel.app/docs/packages/hono)

</div>

## Overview

`@aura-stack/hono` provides a seamless integration layer for **Hono** applications using **Aura Auth**. It allows you to easily mount authentication handlers and protect your routes using type-safe middlewares that run anywhere (Cloudflare Workers, Deno, Bun, Node.js).

It leverages Hono's `Context` to provide session management and authentication flows with first-class TypeScript support.

## Features

- **Hono Middleware** — Standard `withAuth` middleware that keeps your handlers clean.
- **Environment Agnostic** — Works on any runtime supported by Hono.
- **Type-safe Context** — Access the session directly via `c.get('session')` with full type safety.
- **Unified Handlers** — Bridge Web Request/Response API handlers to Hono seamlessly.
- **Native OAuth Support** — Optimized for Hono's internal routing and request handling.

## Installation

```bash
pnpm add @aura-stack/hono @aura-stack/auth
```

## Quick Start

### 1. Configure Auth

Create your authentication instance. This typically goes in a shared file like `lib/auth.ts`.

```tsx
import { createAuth } from "@aura-stack/hono"

export const auth = createAuth({
  oauth: ["github"],
  // your configuration
})

export const { toHandler, withAuth } = auth
```

### 2. Mount Auth Endpoints

Mount the authentication endpoints using `Hono.all()`.

```tsx
import { Hono } from "hono"
import { toHandler } from "./lib/auth"

const app = new Hono()

// All Aura Auth routes (sign-in, sign-out, session, etc.)
app.all("/api/auth/*", toHandler)
```

### 3. Protect Your Routes

Use the `withAuth` middleware to protect routes. The session will be available in the Hono context.

```tsx
import { withAuth } from "./lib/auth"

app.get("/api/protected", withAuth, (c) => {
  const session = c.get("session")

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  return c.json({ message: `Hello, ${session.user.name}!` })
})
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app) for more detailed guides and API references.

## License

Licensed under the [MIT License](LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
