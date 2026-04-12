# Changelog - `@aura-stack/hono`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Removed and cleaned up types and functions exported from the index `/` entry point to reduce import noise, and introduced `/identity`, `/crypto`, and `/shared` as direct entry points for specific utilities. [`#141`](https://github.com/aura-stack-ts/auth/pull/141)

- Introduced a seamless Hono integration package that encapsulates the core authentication logic into middleware and handlers for session management and authentication flows. [#139](https://github.com/aura-stack-ts/auth/pull/139)
