<div align="center">

<h1><b>@aura-stack/react-router</b></h1>

**React-Router authentication adapter for the Aura Stack ecosystem**

[![npm version](https://img.shields.io/npm/v/@aura-stack/react-router.svg)](https://www.npmjs.com/package/@aura-stack/react-router)
[![JSR version](https://jsr.io/badges/@aura-stack/react-router)](https://jsr.io/@aura-stack/react-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [React-Router Package Docs](https://aura-stack-auth.vercel.app/docs/packages/react-router)

</div>

## Overview

`@aura-stack/react-router` provides a seamless integration between **Aura Auth** and **React-Router**, offering framework-specific utilities to handle authentication in a type-safe and idiomatic way.

It bridges the gap between the core authentication engine and React-Router's navigation system, providing the necessary hooks, components, and handlers to build robust authenticated applications.

## Features

- **React-Router Integration** — Optimized for React-Router's routing and loader/action patterns.
- **Concentrated API** — Framework-specific wrappers for a more intuitive developer experience.
- **Unified Hooks** — Access session data and auth methods using standardized React hooks.
- **Type-safe by design** — Full TypeScript support for identity schemas and session data.
- **Seamless Provider** — Easy-to-use AuthProvider to manage global authentication state.

## Installation

```bash
pnpm add @aura-stack/react-router
```

> [!NOTE]
> Ensure you have `react-router` (>= 7.x) installed.

## Quick Start

### 1. Configure Auth Instance

Configure your auth instance in a shared file (e.g., `lib/auth.ts`).

```tsx
import { createAuth } from "@aura-stack/react-router"

export const auth = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
  baseURL: "http://localhost:3000",
})

export const { api, core } = auth
```

### 2. Use API Functions

```tsx
import { api } from "@/lib/auth"

export const loader = async ({ request }) => {
  return await api.getSession({
    headers: request.headers,
  })
}
```

### 3. Configure Auth Client Instance and Auth Provider

Wrap your application with the `AuthProvider` and pass it a configured Aura Auth client.

```tsx
import { createAuthClient, AuthProvider } from "@aura-stack/react-router/client"
import type { PropsWithChildren } from "react"

const client = createAuthClient({
  /* your config */
})

export const App = ({ children }: PropsWithChildren) => {
  return <AuthProvider client={client}>{children}</AuthProvider>
}
```

### 4. Use the Hooks

Access the session or authentication methods from any component in the tree.

```tsx
import { useSession } from "@aura-stack/react-router/client"

export const Profile = () => {
  const { session, status } = useSession()
  if (status === "loading") return <div>Loading...</div>

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
    </div>
  )
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
