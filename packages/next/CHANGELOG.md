# Changelog - `@aura-stack/next`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.2.0] - 2026-07-04

### Added

- Added a `useSignUp` hook for interacting with the mounted `POST /signUp` endpoint. It returns an object with `signUp` and `isPending` fields. [#184](https://github.com/aura-stack-ts/auth/pull/184)

- Introduced an experimental `signUp` flow for both the API and endpoint definitions. The new action enables user account creation within the authentication system and provides customizable payload validation through the supported schema. To enable this feature, developers must configure the `signUp` option when calling `createAuth`. [#183](https://github.com/aura-stack-ts/auth/pull/183)

### Changed

- Updated the `@aura-stack/auth` dependency to `v0.8.0`. [#211](https://github.com/aura-stack-ts/auth/pull/211)

---

## [0.1.0] - 2026-06-05

### Added

- Added a `/cookies` entry module for cookie management, providing utilities for authentication integrations and framework-specific packages. [#178](https://github.com/aura-stack-ts/auth/pull/178)

- Added full support for the Pages Router strategy and introduced new entry modules `/pages/client` and `/pages/context` for accessing dedicated features. [#176](https://github.com/aura-stack-ts/auth/pull/176)

- Introduced the `createAuth` function to manage the Next.js Pages Router. It includes the `toHandler` adapter for handling Node.js requests and is accessible from the `/pages` entry module. [#169](https://github.com/aura-stack-ts/auth/pull/169)

- Updated Next.js API functions (`signIn`, `signInCredentials`, `updateSession`, and `signOut`) to align with the standardized core API contracts, including improved conditional return types for redirect flows, consistent cookie synchronization from API response headers, and support for redirect-aware `updateSession` behavior in App Router helpers. [#146](https://github.com/aura-stack-ts/auth/pull/146)

- Introduced a seamless Next.js integration package that encapsulates Next.js authentication logic for both client-side and server-side rendering by integrating the `@aura-stack/react` package. It supports both rendering strategies, with primary support for server-side rendering (SSR). For client-side usage, import the modules from the `/client` entry point. [#141](https://github.com/aura-stack-ts/auth/pull/141)
