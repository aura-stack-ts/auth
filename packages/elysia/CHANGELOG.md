# Changelog - `@aura-stack/elysia`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

- Introduced seamless Elysia integration package that encapsulates the core authentication logic into plugins and handlers for session management and authentication flows. [#140](https://github.com/aura-stack-ts/auth/pull/140)
