<div align="center">

<h1>Aura Auth + Hono</h1>

**Integration Example App**

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Hono](https://hono.dev/)

</div>

---

## Overview

This project demonstrates **Aura Auth** authentication using [OAuth 2.0 providers](https://aura-stack-auth.vercel.app/docs/) in a [Hono](https://hono.dev/) application.

This integration utilizes the dedicated [`@aura-stack/hono`](../../packages/hono) package, which provides standard middlewares and first-class TypeScript support for Express applications.

## Features Demo

- **Type-safe Middleware**: Uses `withAuth` to protect routes and infer session shapes.
- **Unified Auth Handler**: Reuses framework-agnostic core logic via `toHandler`.
- **Global Context**: Demonstrates how `ctx.get("session")` is automatically populated and typed.

## Getting Started

You can run the documentation site locally for development or contribution.

### From the repository root

```bash
pnpm dev --filter=hono
```

### Or manually from the app directory

```bash
cd apps/hono
bun install
bun run dev
```

Once started, open your browser at `http://localhost:3000` to view the app.

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
