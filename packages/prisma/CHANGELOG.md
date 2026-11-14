# Changelog - `@aura-stack/prisma`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- Excluded generated Prisma resources from the final bundle, reducing its size from 2.3 MB to 52 KB. This prevents unnecessary generated code from being included when users provide their own Prisma Client instance to `prismaAdapter()`. [#318](https://github.com/aura-stack-ts/auth/pull/318)

### Fixed

- Fixed the Prisma Client instance type accepted by `prismaAdapter()`. The type now verifies that the provided instance implements the required methods: `$on`, `$connect`, `$disconnect`, `$executeRaw`, `$executeRawUnsafe`, `$queryRaw`, `$queryRawUnsafe`, and `$transaction`. [#318](https://github.com/aura-stack-ts/auth/pull/318)

---

## [0.1.0] - 2026-08-05

### Added

- Introduced the experimental `@aura-stack/prisma` package, providing a built-in Prisma ORM adapter for persisting stateful sessions with `@aura-stack/auth`. [#239](https://github.com/aura-stack-ts/auth/pull/239)
