<div align="center">
  
<h1><b>@aura-stack/elysia</b></h1>

**Elysia middleware and utilities for the Aura Stack authentication library**

[![npm version](https://img.shields.io/npm/v/@aura-stack/elysia.svg)](https://www.npmjs.com/package/@aura-stack/elysia)
[![JSR version](https://jsr.io/badges/@aura-stack/elysia)](https://jsr.io/@aura-stack/elysia)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Elysia Package Docs](https://aura-stack-auth.vercel.app/docs/packages/elysia)

</div>

## Overview

`@aura-stack/elysia` provides a seamless integration layer for **Elysia** applications using **Aura Auth**. It allows you to easily mount authentication handlers and protect your routes using type-safe context derivation.

It leverages Elysia's functional architecture to provide session management and authentication flows with first-class TypeScript support.

## Features

- **Elysia Native** — Designed to work with Elysia's `.derive()` and `.resolve()` patterns.
- **Type-safe Context** — Automatically injects `session` into your handlers with full type inference.
- **Unified Handlers** — Bridge Web Request/Response API handlers to Elysia effortlessly.
- **Deno & Bun Ready** — Optimized for high-performance runtimes.

## Installation

```bash
pnpm add @aura-stack/elysia @aura-stack/auth
```

## Quick Start

### 1. Configure Auth

Create your authentication instance. This typically goes in a shared file like `lib/auth.ts`.

```tsx
import { createAuth } from "@aura-stack/elysia"

export const auth = createAuth({
  oauth: ["github"],
  // your configuration
})

export const { toHandler, withAuth } = auth
```

### 2. Mount Auth Endpoints

Mount the authentication endpoints using `app.all()`.

```tsx
import { Elysia } from "elysia"
import { toHandler } from "./lib/auth"

const app = new Elysia().all("/api/auth/*", (ctx) => toHandler(ctx))
```

### 3. Protect Your Routes

Use the `withAuth` utility with `.derive()` to protect routes. The session will be available in the handler's context.

```tsx
import { withAuth } from "./lib/auth"

app.derive(withAuth).get("/api/protected", ({ session, error }) => {
  if (!session) {
    return error(401, "Unauthorized")
  }

  return { message: `Hello, ${session.user.name}!` }
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
