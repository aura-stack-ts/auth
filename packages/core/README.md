<div align="center">

<h1><b>@aura-stack/auth</b></h1>

**Core authentication library for the Aura Stack ecosystem**

[![npm version](https://img.shields.io/npm/v/@aura-stack/auth.svg)](https://www.npmjs.com/package/@aura-stack/auth)
[![JSR version](https://jsr.io/badges/@aura-stack/auth)](https://jsr.io/@aura-stack/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Core Package Docs](https://aura-stack-auth.vercel.app/docs/packages/core)

</div>

## Overview

`@aura-stack/auth` provides the **core logic and building blocks** for authentication and authorization within the **Aura Stack** ecosystem.

It offers a **framework-agnostic**, **type-safe**, and **secure** solution to handle authentication flows such as OAuth 2.0 and OpenID Connect.  
Inspired by [Auth.js](https://authjs.dev/), Aura Auth focuses on simplicity, developer experience, and strong security practices.

## Features

- **OAuth 2.0** — Native support for multiple OAuth providers.
- **Type-safe by design** — First-class TypeScript support with complete type inference.
- **Secure sessions** — Built-in JWT-based session management with encryption and signing.
- **Cookie handling** — Secure, configurable cookies for session persistence.
- **Extensible architecture** — Easily integrate with `@aura-stack/router` or custom routing layers.
- **Framework-agnostic** — Works seamlessly in any environment that supports the Web Request/Response APIs.

## Installation

```bash
pnpm add @aura-stack/auth
```

## Quick Start

### 1. Create Auth Instance

Configure your auth instance in a shared file (e.g., `lib/auth.ts`).

```ts
import { createAuth } from "@aura-stack/auth"

export const auth = createAuth({
  oauth: ["github"],
})

export const { api, jose handlers } = auth
```

### 2. Creat Auth Client Instance

Configure your auth client instance in a shared file (e.g., `lib/auth-client.ts`).

```ts
import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuth({
  baseURL: "http://localhost:3000",
})
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
