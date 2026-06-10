# Changelog - `@aura-stack/express`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Introduced an experimental `signUp` flow for both the API and endpoint definitions. The new action enables user account creation within the authentication system and provides customizable payload validation through the supported schema. To enable this feature, developers must configure the `signUp` option when calling `createAuth`. [#183](https://github.com/aura-stack-ts/auth/pull/183)

---

## [0.1.0] - 2026-06-05

### Added

- Added a `/cookies` entry module for cookie management, providing utilities for authentication integrations and framework-specific packages. [#178](https://github.com/aura-stack-ts/auth/pull/178)

- Removed and cleaned up types and functions exported from the index `/` entry point to reduce import noise, and introduced `/identity`, `/crypto`, and `/shared` as direct entry points for specific utilities. [`#141`](https://github.com/aura-stack-ts/auth/pull/141)

- Introduced a seamless Express integration package that encapsulates the core authentication logic into middleware and handlers for session management and authentication flows. [#138](https://github.com/aura-stack-ts/auth/pull/138)
