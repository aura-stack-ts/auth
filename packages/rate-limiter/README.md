<div align="center">
  
<h1><b>@aura-stack/rate-limiter</b></h1>

**Rate limiting utilities for the Aura Stack ecosystem**

[![npm version](https://img.shields.io/npm/v/@aura-stack/rate-limiter.svg)](https://www.npmjs.com/package/@aura-stack/rate-limiter)
[![JSR version](https://jsr.io/badges/@aura-stack/rate-limiter)](https://jsr.io/@aura-stack/rate-limiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Rate Limiter Package Docs](https://aura-stack-auth.vercel.app/docs/packages/rate-limiter)

</div>

## Overview

`@aura-stack/rate-limiter` provides flexible and performant rate limiting solutions designed for the **Aura Stack** ecosystem but usable in any TypeScript project.

It offers pluggable storage backends and algorithms to protect your APIs and authentication endpoints from brute-force attacks and abuse.

## Features

- **Token Bucket Algorithm** — Precise control over request rates with burst support.
- **In-Memory Store** — Fast, built-in memory storage for single-instance applications.
- **Framework Agnostic** — Works in Node.js, Bun, Deno, and Edge runtimes.
- **Type-Safe** — Comprehensive TypeScript definitions for all algorithms and stores.
- **Extensible** — Easily implement custom storage backends (Redis, Database, etc.).

## Installation

```bash
pnpm add @aura-stack/rate-limiter
```

## Quick Start

### Basic Usage with Token Bucket

```tsx
import { createRateLimiter } from "@aura-stack/rate-limiter"
import { TokenBucket } from "@aura-stack/rate-limiter/algorithms"

const limiter = createRateLimiter({
  algorithm: new TokenBucket({
    capacity: 10,
    refillRate: 1, // 1 token per second
  }),
})

async function handleRequest(userId: string) {
  const result = await limiter.consume(userId)
  
  if (!result.success) {
    throw new Error("Too many requests. Try again later.")
  }
  
  // Proceed with request
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
