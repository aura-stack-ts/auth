# Aura Stack Auth

<div align="center">

**A modern, type-safe authentication library for TypeScript**

[![npm version](https://img.shields.io/npm/v/@aura-stack/auth.svg)](https://www.npmjs.com/package/@aura-stack/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

</div>

## Overview

Aura Stack Auth is an open-source authentication library designed for modern TypeScript applications. Inspired by [Auth.js](https://authjs.dev/), it provides a simple yet powerful API for implementing authentication flows with a focus on developer experience and security.

### ✨ Features

- 🔐 **OAuth 2.0 & OpenID Connect** - Full support for modern authentication standards
- 🎯 **Type-Safe** - Built with TypeScript for excellent IDE support and type safety
- 🚀 **Framework Agnostic** - Works with any JavaScript runtime or framework
- 🛡️ **Secure by Default** - Following security best practices out of the box
- 🔌 **Extensible** - Easy to customize and extend for your needs
- 📦 **Lightweight** - Minimal dependencies and small bundle size
- 🎨 **Developer Friendly** - Intuitive API design for great DX

## Quick Start

### Installation

```bash
pnpm add @aura-stack/auth
# or
npm install @aura-stack/auth
# or
yarn add @aura-stack/auth
```

### Basic Usage

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

// Use the auth handlers in your application
export const { handlers } = auth
```

## Documentation

- **Getting Started** - [Installation and setup guide](#quick-start)
- **Configuration** - Learn how to configure providers and options
- **API Reference** - Detailed API documentation
- **Examples** - Real-world usage examples

## Packages

This monorepo contains the following packages:

- [`@aura-stack/auth`](./packages/core) - Core authentication library
- [`@aura-stack/jose`](./packages/jose) - JOSE utilities for JWT and encryption

## Development

### Prerequisites

- Node.js 18+
- pnpm 10.15.0+

### Setup

```bash
# Clone the repository
git clone https://github.com/aura-stack-js/auth.git
cd auth

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

### Scripts

- `pnpm dev` - Start development mode with watch
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Security

If you discover a security vulnerability, please send an email to [aurastackjs@gmail.com](mailto:aurastackjs@gmail.com). All security vulnerabilities will be promptly addressed.

## License

MIT © [Aura Stack](https://github.com/aura-stack-js)

See [LICENSE](LICENSE) for more information.

## Support

- 📖 [Documentation](https://github.com/aura-stack-js/auth#readme)
- 🐛 [Issue Tracker](https://github.com/aura-stack-js/auth/issues)
- 💬 [Discussions](https://github.com/aura-stack-js/auth/discussions)

## Acknowledgments

Built with inspiration from the excellent work of:

- [Auth.js](https://authjs.dev/) (formerly NextAuth.js)
- [Better Auth](https://github.com/better-auth/better-auth)
- The broader open-source authentication community

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-js">Aura Stack team</a>
</p>
