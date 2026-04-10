<div align="center">
  
<h1><b>@aura-stack/react</b></h1>

**React context and hooks for the Aura Stack authentication library**

[![npm version](https://img.shields.io/npm/v/@aura-stack/react.svg)](https://www.npmjs.com/package/@aura-stack/react)
[![JSR version](https://jsr.io/badges/@aura-stack/react)](https://jsr.io/@aura-stack/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [React Package Docs](https://aura-stack-auth.vercel.app/docs/packages/react)

</div>

## Overview

`@aura-stack/react` provides a seamless integration layer for **React** applications using **Aura Auth**. It encapsulates the core authentication logic into a single React context, exposing powerful and easy-to-use hooks for session management and authentication flows.

It ensures that session state is synchronized across your entire component tree, reducing redundant network requests and providing a smooth developer experience.

## Features

- **Context-driven** — Single source of truth for session state and auth methods.
- **Custom Hooks** — `useAuth`, `useSession`, `useSignIn`, `useSignOut`, and `useUpdateSession`.
- **Type-safe** — Full TypeScript support for session objects and provider options.
- **Optimistic Updates** — Built-in support for session refreshes and status transitions.
- **Seamless Integration** — Works with any Aura Auth client configuration.

## Installation

```bash
pnpm add @aura-stack/react @aura-stack/auth
```

> [!NOTE]
> Ensure you have `react` (>= 19.x) installed.

## Quick Start

### 1. Configure the Provider

Wrap your application with the `AuthProvider` and pass it a configured Aura Auth client.

```tsx
import { createAuthClient } from "@aura-stack/auth/client"
import { AuthProvider } from "@aura-stack/react"

const client = createAuthClient({
  /* your config */
})

export const App = ({ children }) => {
  return <AuthProvider client={client}>{children}</AuthProvider>
}
```

### 2. Use the Hooks

Access the session or authentication methods from any component in the tree.

```tsx
import { useSession, useSignIn, useSignOut } from "@aura-stack/react"

export const UserProfile = () => {
  const { session, status } = useSession()
  const signIn = useSignIn()
  const signOut = useSignOut()

  if (status === "loading") return <div>Loading...</div>

  if (!session) {
    return <button onClick={() => signIn("github")}>Sign in with GitHub</button>
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app) for more detailed guides and API references.

## License

Licensed under the [MIT License](LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
