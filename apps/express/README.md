<div align="center">
 
<h1>Aura Auth + Express</h1>
 
**Integration Example App**
 
[Official Docs](https://aura-stack-auth.vercel.app/docs/oauth) · [Express](https://expressjs.com/)
 
</div>
 
---
 
## Overview
 
This project demonstrates **Aura Auth** authentication using [OAuth 2.0 providers](https://aura-stack-auth.vercel.app/docs/) in an [Express](https://expressjs.com/) application.
 
This integration utilizes the dedicated [`@aura-stack/express`](../../packages/express) package, which provides standard middlewares and first-class TypeScript support for Express applications.
 
## Features Demo
 
- **Type-safe Middleware**: Uses `withAuth` to protect routes and infer session shapes.
- **Unified Auth Handler**: Reuses framework-agnostic core logic via `toHandler`.
- **Global Context**: Demonstrates how `res.locals.session` is automatically populated and typed.
 
## Getting Started
 
### From the repository root
 
```bash
pnpm dev --filter=express
```
 
### Or manually from the app directory
 
```bash
cd apps/express
pnpm install
pnpm dev
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
