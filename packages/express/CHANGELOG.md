# Changelog - `@aura-stack/express`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added the `/types` entry point to re-export the public types from `@aura-stack/auth` and expose the integration-specific `ExpressInstance` type. [#257](https://github.com/aura-stack-ts/auth/pull/257)

### Fixed

- Fixed type inference for `signUp.schema` and `identity.schema` across authentication instances. The configured Zod, Valibot, TypeBox, or ArkType schema is now correctly propagated through the auth instance. Updated `InferUser`, `InferSession`, and `InferSignUp` to correctly derive their types from the corresponding auth instance. [#256](https://github.com/aura-stack-ts/auth/pull/256)

---

## [0.3.0] - 2026-08-05

### Changed

- Updated the `@aura-stack/auth` dependency to `v0.9.0`. [#252](https://github.com/aura-stack-ts/auth/pull/252)

---

## [0.2.2] - 2026-07-07

### Fixed

- Fixed type inference for the `signUp.schema` configuration. Sign-up schema types are now inferred correctly throughout the authentication flow. [#216](https://github.com/aura-stack-ts/auth/pull/216)

---

## [0.2.1] - 2026-07-04

### Fixed

- Republished the package to include the missing `huggingface` OAuth provider in the published package.
  > This release contains no code changes compared to `v0.2.0`; it only corrects the published package contents.

---

## [0.2.0] - 2026-07-04

### Added

- Introduced an experimental `signUp` flow for both the API and endpoint definitions. The new action enables user account creation within the authentication system and provides customizable payload validation through the supported schema. To enable this feature, developers must configure the `signUp` option when calling `createAuth`. [#183](https://github.com/aura-stack-ts/auth/pull/183)

### Changed

- Updated the `@aura-stack/auth` dependency to `v0.8.0`. [#211](https://github.com/aura-stack-ts/auth/pull/211)

---

## [0.1.0] - 2026-06-05

### Added

- Added a `/cookies` entry module for cookie management, providing utilities for authentication integrations and framework-specific packages. [#178](https://github.com/aura-stack-ts/auth/pull/178)

- Removed and cleaned up types and functions exported from the index `/` entry point to reduce import noise, and introduced `/identity`, `/crypto`, and `/shared` as direct entry points for specific utilities. [`#141`](https://github.com/aura-stack-ts/auth/pull/141)

- Introduced a seamless Express integration package that encapsulates the core authentication logic into middleware and handlers for session management and authentication flows. [#138](https://github.com/aura-stack-ts/auth/pull/138)
