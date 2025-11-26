<div align="center">

<h1><b>@aura-stack/jose</b></h1>

**Type-safe JOSE utilities for JWT signing, verification, and encryption**

[![npm version](https://img.shields.io/npm/v/@aura-stack/jose.svg)](https://www.npmjs.com/package/@aura-stack/jose)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Official Docs](https://aura-stack-auth.vercel.app/docs) · [JOSE Package Docs](https://aura-stack-auth.vercel.app/docs/packages/jose)

</div>

---

## Overview

`@aura-stack/jose` is a lightweight, type-safe wrapper around the [`jose`](https://github.com/panva/jose) library.  
It provides utilities for working with **JWS (signing)**, **JWE (encryption)**, and **JWTs**, offering a simplified, consistent API built for modern TypeScript environments.

This package is used internally by [`@aura-stack/auth`](https://www.npmjs.com/package/@aura-stack/auth) but can also be installed and used as a standalone module.

## Features

- **JWT management** — Sign, verify, encrypt, and decrypt JWTs with ease.
- **Type-safe** — Built with modern TypeScript for full type inference.
- **Composable utilities** — Use `createJWS`, `createJWE`, and `createJWT` to simplify configuration.
- **Lightweight integration** — Minimal wrapper around `jose` for better DX without overhead.
- **Flexible algorithms** — Compatible with HMAC, RSA, and EC key types.

## Documentation

Visit the [**official documentation website**](https://aura-stack-auth.vercel.app).

## License

Licensed under the [MIT License](LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>
