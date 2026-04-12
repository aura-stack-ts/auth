<div align="center">
  
<h1><b>@aura-stack/next</b></h1>

**Aura Auth adapter and utilities for the Next.js ecosystem**

[![npm version](https://img.shields.io/npm/v/@aura-stack/next.svg)](https://www.npmjs.com/package/@aura-stack/next)
[![JSR version](https://jsr.io/badges/@aura-stack/next)](https://jsr.io/@aura-stack/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Next.js Package Docs](https://aura-stack-auth.vercel.app/docs/packages/next)

</div>

## Overview

`@aura-stack/next` provides a high-level, type-safe integration for **Next.js** applications using **Aura Auth**. It is designed for maximum developer experience in the App Router, offering dedicated utilities for Server Components, Server Actions, Middleware, and Route Handlers.

By utilizing a **"Concentrated API"** pattern, it optimizes core authentication logic for the Next.js runtime, automatically managing context-aware data like cookies and headers via `next/headers`.

## Features

- **App Router Optimized** — Full support for React Server Components (RSC) and Server Actions.
- **Concentrated API** — Dedicated `auth.api` for Next.js that automates session fetching and redirects.
- **Aggregated Client Entry** — Consolidated `import { ... } from "@aura-stack/next/client"` for all hooks and context.
- **Type-safe by design** — Automatic type inference from your identity schema.

## Installation

```bash
pnpm add @aura-stack/next
```

## Structure

The package follows a clear environment-based separation:

- **`@aura-stack/next`**: All server-side logic (Factory, Server API, Middleware).
- **`@aura-stack/next/client`**: All client-side logic (Provider, Hooks, UI Components).
- **`@aura-stack/next/types`**: Universal Type definitions.

## Quick Start

### 1. Initialize Auth

Configure your auth instance in a shared file (e.g., `lib/auth.ts`).

```tsx
import { createAuth } from "@aura-stack/next"

export const auth = createAuth({
  oauth: ["github"],
})

export const { api, core } = auth
```

### 2. Set Up Route Handler

Configure the catch-all route in `app/api/auth/[...auth]/route.ts`.

```tsx
import { core } from "@/lib/auth"

export const { GET, POST, PATCH } = core.handlers
```

### 3. Access Session (Server-side)

Use the optimized API in your Server Components.

```tsx
import { api } from "@/lib/auth"

export default async function Page() {
  const session = await api.getSession()

  if (!session) return <div>Not signed in</div>

  return <div>Welcome, {session.user.name}</div>
}
```

### 4. Client-side Implementation

Use the consolidated client entry for hooks and context.

```tsx
"use client"
import { useSession } from "@aura-stack/next/client"

export function Profile() {
  const { session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>
  if (!session) return <SignInButton />

  return <div>Signed in as {session.user.email}</div>
}
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
