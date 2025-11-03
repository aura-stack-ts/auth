# Changelog - `@aura-stack/auth`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added support for the `error` and `error_description` properties to standardize error handling in accordance with the [OAuth 2.0 RFC (section 5.2)](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2). These fields are used to describe errors returned by the application or by third‑party authorization servers. [#2](https://github.com/aura-stack-ts/auth/pull/2)

- Introduced the `@aura-stack/auth` package which implements the OAuth workflow and exposes the `/signIn/:provider`, `/callback/:provider`, and `/session` endpoints. The package uses `@aura-stack/router` to define routes and is configured via `createAuth`, which accepts OAuth provider configurations and includes a default GitHub provider for convenience. [#1](https://github.com/aura-stack-ts/auth/pull/1)
