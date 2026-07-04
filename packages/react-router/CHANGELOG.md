# Changelog - `@aura-stack/react-router`

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

- Updated the React Router server API helpers and types to align with the standardized core API contracts, including request-driven options for `signInCredentials`, `updateSession`, and `signOut`, explicit conditional return types for redirect and non-redirect flows, and `toResponse()`-based response handling. [#146](https://github.com/aura-stack-ts/auth/pull/146)

- Introduced a seamless React Router v7 integration package that encapsulates React Router v7 authentication logic for both client-side and server-side rendering by integrating the `@aura-stack/react` package. It supports both rendering strategies, with primary support for server-side rendering (SSR). For client-side usage, import the modules from the `/client` entry point. [#142](https://github.com/aura-stack-ts/auth/pull/142)
