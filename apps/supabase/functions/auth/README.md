<div align="center">

<h1>Aura Auth + Supabase Edge Functions</h1>

**Demonstration app**

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

</div>

---

## Overview

This project demonstrates Aura Auth authentication using [OAuth 2.0 providers](https://aura-stack-auth.vercel.app/docs/) in a [Supabase Edge Functions](https://supabase.com/docs/guides/functions) application.

## Getting Started

You can run the demo app locally for development or testing.

### From the repository root

```bash
cd apps/supabase/functions/auth

# deno
deno install
deno run dev

# pnpm
pnpm install
pnpm dev
```

Once started, open your browser at `http://localhost:8000` to view the app.

### Test the function locally

```bash
cd apps/supabase

# deno
deno run start
deno run dev:server
deno run stop

# pnpm
pnpm start
pnpm dev:server
pnpm stop
```

Once started, open `http://127.0.0.1:54321/functions/v1/auth` in your browser and send a request to the Edge Function.

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](../../../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
