<div align="center">

<h1>Aura Auth + Elysia</h1>

**Demonstration app**

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Elysia](https://elysiajs.com/)

</div>

---

## Overview

This project demonstrates Aura Auth authentication using [OAuth 2.0 providers](https://aura-stack-auth.vercel.app/docs/) in a [Elysia](https://elysiajs.com/) application.

This integration utilizes the dedicated [`@aura-stack/elysia`](../../packages/elysia) package, which provides standard middlewares and first-class TypeScript support for Elysia applications.

## Features Demo

- **Type-safe Middleware**: Uses `withAuth` to protect routes and infer session shapes.
- **Unified Auth Handler**: Reuses framework-agnostic core logic via `toHandler`.
- **Global Context**: Demonstrates how `session` is automatically populated and typed.

## Getting Started

You can run the documentation site locally for development or contribution.

### From the repository root

```bash
pnpm dev --filter=elysia
```

### Or manually from the app directory

```bash
cd apps/elysia
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
