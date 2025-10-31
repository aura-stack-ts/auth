# @aura-stack/jose

<div align="center">

**JOSE utilities for Aura Stack Auth**

[![npm version](https://img.shields.io/npm/v/@aura-stack/jose.svg)](https://www.npmjs.com/package/@aura-stack/jose)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## Overview

A lightweight wrapper around the [jose](https://github.com/panva/jose) library, providing convenient utilities for JWT signing, verification, and encryption. This package is used internally by `@aura-stack/auth` but can also be used standalone.

## Features

- 🔐 **JWT Operations** - Sign and verify JSON Web Tokens
- 🔒 **Encryption** - Encrypt and decrypt data using JWE
- 🎯 **Type-Safe** - Full TypeScript support
- 📦 **Lightweight** - Minimal wrapper over jose library
- ⚙️ **Flexible** - Support for multiple algorithms and key types

## Installation

```bash
pnpm add @aura-stack/jose
# or
npm install @aura-stack/jose
# or
yarn add @aura-stack/jose
```

## Exports

This package provides multiple entry points:

- `@aura-stack/jose` - Main export
- `@aura-stack/jose/encrypt` - Encryption utilities
- `@aura-stack/jose/sign` - Signing utilities
- `@aura-stack/jose/jose` - Re-export of jose library

## Usage

### JWT Signing

```typescript
import { sign } from "@aura-stack/jose/sign"

const token = await sign({ userId: "123", email: "user@example.com" }, "your-secret-key")
```

### JWT Verification

```typescript
import { verify } from "@aura-stack/jose/sign"

const payload = await verify(token, "your-secret-key")
console.log(payload.userId) // '123'
```

### Encryption

```typescript
import { encrypt, decrypt } from "@aura-stack/jose/encrypt"

// Encrypt data
const encrypted = await encrypt({ sensitive: "data" }, "your-encryption-key")

// Decrypt data
const decrypted = await decrypt(encrypted, "your-encryption-key")
```

### Using jose Library Directly

```typescript
import * as jose from "@aura-stack/jose/jose"

// Access full jose library functionality
const jwt = await new jose.SignJWT({ "urn:example:claim": true })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("2h")
  .sign(secret)
```

## API Reference

### Signing

Utilities for JWT signing and verification.

```typescript
import { sign, verify } from "@aura-stack/jose/sign"
```

### Encryption

Utilities for data encryption and decryption.

```typescript
import { encrypt, decrypt } from "@aura-stack/jose/encrypt"
```

### JOSE

Direct access to the jose library for advanced use cases.

```typescript
import * as jose from "@aura-stack/jose/jose"
```

## Dependencies

This package depends on:

- `jose` - JavaScript Object Signing and Encryption (JOSE) library

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

## Security Considerations

- Always use strong, randomly generated secrets for signing and encryption
- Store secrets securely using environment variables or secret management systems
- Regularly rotate your keys and secrets
- Use appropriate token expiration times

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © [Aura Stack](https://github.com/aura-stack-js)

## Links

- [Main Repository](https://github.com/aura-stack-js/auth)
- [Documentation](https://github.com/aura-stack-js/auth#readme)
- [Issue Tracker](https://github.com/aura-stack-js/auth/issues)
- [jose Library](https://github.com/panva/jose)
