# Changelog - `@aura-stack/oak`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added the `/types` entry point to re-export the public types from `@aura-stack/auth` and expose the integration-specific `OakInstance` type. [#257](https://github.com/aura-stack-ts/auth/pull/257)

- Introduced a seamless Oak integration package that encapsulates the core authentication logic into middleware and handlers for session management and authentication flows. [#253](https://github.com/aura-stack-ts/auth/pull/253)
