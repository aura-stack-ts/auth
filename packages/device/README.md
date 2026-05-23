<div align="center">

<h1><b>@aura-stack/device</b></h1>

**OAuth 2.0 Device Authorization Grant for the Aura Stack ecosystem**

[![npm version](https://img.shields.io/npm/v/@aura-stack/device.svg)](https://www.npmjs.com/package/@aura-stack/device)
[![JSR version](https://jsr.io/badges/@aura-stack/device)](https://jsr.io/@aura-stack/device)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [Core Package Docs](https://aura-stack-auth.vercel.app/docs/packages/core)

</div>

## Quick start

```ts
import { createDeviceClient } from "@aura-stack/device"

const client = createDeviceClient({ providers: ["github"] })

const { userCode, verificationURI } = await client.authorize("github")
console.log(`Visit ${verificationURI} and enter ${userCode}`)

const session = await client.poll()
console.log(session.user)
```

Poll with explicit credentials:

```ts
const session = await client.poll({
  providerId: "github",
  deviceCode: "...",
  timeout: 600_000,
})
```

## Installation

```bash
pnpm add @aura-stack/device
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](../../LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
