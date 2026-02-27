<div align="center">

<h1>Aura Auth + Cloudflare Workers</h1>

**Demonstration app**

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Cloudflare Workers](https://developers.cloudflare.com/workers/get-started/guide/)

</div>

---

## Overview

This project demonstrates Aura Auth authentication using [OAuth 2.0 providers](https://aura-stack-auth.vercel.app/docs/) in a
[Cloudflare Workers](https://developers.cloudflare.com/workers/get-started/guide/) application.

## Getting Started

You can run the demo app locally for development or testing.

### From the repository root

```bash
pnpm dev --filter=cloudflare
```

### Or manually from the app directory

```bash
cd apps/cloudflare
pnpm install
pnpm typegen
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
