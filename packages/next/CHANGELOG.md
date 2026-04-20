# Changelog - `@aura-stack/next`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Updated Next.js API functions (`signIn`, `signInCredentials`, `updateSession`, and `signOut`) to align with the standardized core API contracts, including improved conditional return types for redirect flows, consistent cookie synchronization from API response headers, and support for redirect-aware `updateSession` behavior in App Router helpers. [#146](https://github.com/aura-stack-ts/auth/pull/146)

- Introduced a seamless Next.js integration package that encapsulates Next.js authentication logic for both client-side and server-side rendering by integrating the `@aura-stack/react` package. It supports both rendering strategies, with primary support for server-side rendering (SSR). For client-side usage, import the modules from the `/client` entry point. [#141](https://github.com/aura-stack-ts/auth/pull/141)
