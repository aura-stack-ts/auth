# @aura-stack/auth

<div align="center">

**Core authentication library for Aura Stack**

[![npm version](https://img.shields.io/npm/v/@aura-stack/auth.svg)](https://www.npmjs.com/package/@aura-stack/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## Overview

The core package of Aura Stack Auth provides a framework-agnostic authentication solution with support for OAuth 2.0 and OpenID Connect. Inspired by [Auth.js](https://authjs.dev/), it offers a simple and intuitive API for building secure authentication flows.

## Features

- 🔐 **OAuth 2.0 & OIDC** - Support for multiple OAuth providers
- 🎯 **Type-Safe** - Full TypeScript support with excellent type inference
- 🛡️ **Secure Sessions** - Built-in session management with JWT
- 🔌 **Router Integration** - Works with `@aura-stack/router` for flexible routing
- 🎨 **Cookie Management** - Secure cookie handling out of the box
- ⚙️ **Configurable** - Easy to configure and extend

## Installation

```bash
pnpm add @aura-stack/auth
# or
npm install @aura-stack/auth
# or
yarn add @aura-stack/auth
```

## Quick Start

### Basic Setup

```typescript
import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
  oauth: {
    providers: [
      {
        id: "github",
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    ],
  },
})

export const { handlers } = auth
```

### Environment Variables

Create a `.env` file in your project root:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### Using with Your Framework

The `handlers` object can be integrated with any JavaScript framework or runtime:

```typescript
// Example with a Node.js server
import { handlers } from "./auth"

server.use("/auth", handlers)
```

## API Reference

### `createAuth(config)`

Creates an authentication instance with the provided configuration.

#### Parameters

- `config` (optional): Authentication configuration object
  - `oauth`: OAuth configuration
    - `providers`: Array of OAuth provider configurations

#### Returns

An object containing:

- `handlers`: Router handlers for authentication endpoints

### Default Routes

When you create an auth instance, the following routes are automatically available:

- `/auth/signin` - Initialize OAuth sign-in flow
- `/auth/callback` - OAuth callback handler
- `/auth/session` - Get current session information

## Configuration

### OAuth Providers

Configure OAuth providers in your auth configuration:

```typescript
const auth = createAuth({
  oauth: {
    providers: [
      {
        id: "github",
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      {
        id: "google",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    ],
  },
})
```

## Dependencies

This package depends on:

- `@aura-stack/jose` - JOSE utilities for JWT and encryption
- `@aura-stack/router` - Flexible routing solution
- `cookie` - Cookie parsing and serialization
- `zod` - Runtime type validation

## Development

### Scripts

```bash
# Development with watch mode
pnpm dev

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Type checking
pnpm type-check

# Format code
pnpm format
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © [Aura Stack](https://github.com/aura-stack-js)

## Links

- [Main Repository](https://github.com/aura-stack-js/auth)
- [Documentation](https://github.com/aura-stack-js/auth#readme)
- [Issue Tracker](https://github.com/aura-stack-js/auth/issues)
