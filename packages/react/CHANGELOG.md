# Changelog - `@aura-stack/react`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added support for multi-tab synchronization via `BroadcastChannel`, allowing sessions to stay synchronized across browser tabs during the auth flow. Additionally, added a centralized `useAuthActions` hook that re-exports all auth actions (`signIn`, `updateSession`, `signOut`, etc.). [#172](https://github.com/aura-stack-ts/auth/pull/172)

- Updated React context and hooks (`useSignInCredentials`, `useUpdateSession`, and related context actions) to align with the standardized core client API contracts, including the new object-based credentials/session payload shapes and redirect-driven refresh behavior, while simplifying React-side auth type definitions. [#146](https://github.com/aura-stack-ts/auth/pull/146)

- Removed and cleaned up types and functions exported from the index `/` entry point to reduce import noise, and introduced `/identity`, `/crypto`, and `/shared` as direct entry points for specific utilities. [#141](https://github.com/aura-stack-ts/auth/pull/141)

- Introduced seamless React integration package that encapsulates the core authentication logic into a single React context, exposing powerful and easy-to-use hooks for session management and authentication flows. [#137](https://github.com/aura-stack-ts/auth/pull/137)
