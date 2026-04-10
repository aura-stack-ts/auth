<div align="center">
  
<h1><b>@aura-stack/express</b></h1>

**Type-safe Express middleware and utilities for the Aura Stack authentication library**

[![npm version](https://img.shields.io/npm/v/@aura-stack/express.svg)](https://www.npmjs.com/package/@aura-stack/express)
[![JSR version](https://jsr.io/badges/@aura-stack/express)](https://jsr.io/@aura-stack/express)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Express Package Docs](https://aura-stack-auth.vercel.app/docs/packages/express)

</div>

## Overview

`@aura-stack/express` provides a seamless integration layer for **Express** applications using **Aura Auth**. It encapsulates the core authentication logic into standard Express middlewares, ensuring that your session state is correctly typed and accessible throughout your application's middleware chain.

By leveraging TypeScript's global augmentation and middleware inference, it provides a "zero-effort" typed experience for your protected routes.

## Features

- **Standard Middleware** — Use `withAuth` as a standard middleware in your route definitions.
- **Deep Type Inference** — Automatically infers your custom `User` and `Session` shapes from the initial configuration.
- **Global Augmentation** — Adds first-class support for `res.locals.session` directly to Express types.
- **Framework-Agnostic Core** — Bridge Web Request/Response API handlers to Express without sacrificing performance.
- **Typed Propagation** — Middleware correctly propagates types to subsequent handlers in the route chain.

## Installation

```bash
pnpm add @aura-stack/express
```

## Quick Start

### 1. Configure Auth

Create your authentication instance. This typically goes in a shared file like `lib/auth.ts`.

```tsx
import { createAuth } from "@aura-stack/express"

export const auth = createAuth({
  oauth: ["github"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

export const { toHandler, withAuth } = auth
```

### 2. Mount Auth Endpoints

Mount the authentication endpoints on your desired base path (default: `/api/auth`).

```tsx
import express from "express"
import { toHandler } from "./lib/auth"

const app = express()

// All Aura Auth routes (sign-in, sign-out, session, etc.)
app.all("/api/auth/*", toHandler)
```

### 3. Protect Your Routes

Use the `withAuth` middleware to protect routes. The session will be automatically available and **fully typed** in `res.locals.session`.

```tsx
import { withAuth } from "./lib/auth"

app.get("/api/protected", withAuth, (req, res) => {
  // session is automatically available and typed!
  const session = res.locals.session

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  // TypeScript knows about session.user.name, email, etc.
  res.json({ message: `Hello, ${session.user.name}!` })
})
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app) for more detailed guides and API references.

## License

Licensed under the [MIT License](../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
