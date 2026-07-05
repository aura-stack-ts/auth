# Changelog - `@aura-stack/react`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.2.1] - 2026-07-04

### Fixed

- Republished the package to include the missing `huggingface` OAuth provider in the published package.
  > This release contains no code changes compared to `v0.2.0`; it only corrects the published package contents.

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

- Added support for a custom `redirect` function in `AuthProvider`, allowing callers to provide their own redirect implementation for seamless integration with framework-specific navigation APIs. [#175](https://github.com/aura-stack-ts/auth/pull/175)

- Added support for multi-tab synchronization via `BroadcastChannel`, allowing sessions to stay synchronized across browser tabs during the auth flow. Additionally, added a centralized `useAuthActions` hook that re-exports all auth actions (`signIn`, `updateSession`, `signOut`, etc.). [#172](https://github.com/aura-stack-ts/auth/pull/172)

- Updated React context and hooks (`useSignInCredentials`, `useUpdateSession`, and related context actions) to align with the standardized core client API contracts, including the new object-based credentials/session payload shapes and redirect-driven refresh behavior, while simplifying React-side auth type definitions. [#146](https://github.com/aura-stack-ts/auth/pull/146)

- Removed and cleaned up types and functions exported from the index `/` entry point to reduce import noise, and introduced `/identity`, `/crypto`, and `/shared` as direct entry points for specific utilities. [#141](https://github.com/aura-stack-ts/auth/pull/141)

- Introduced seamless React integration package that encapsulates the core authentication logic into a single React context, exposing powerful and easy-to-use hooks for session management and authentication flows. [#137](https://github.com/aura-stack-ts/auth/pull/137)
