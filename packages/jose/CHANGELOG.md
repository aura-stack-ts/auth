# Changelog - `@aura-stack/jose`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Reconsidered the package's purpose and renamed it from `@aura-stack/session` to `@aura-stack/jose`. The package now focuses on implementing standardized processes for [signing (JWS)](https://datatracker.ietf.org/doc/html/rfc7515), [encrypting (JWE)](https://datatracker.ietf.org/doc/html/rfc7516), and [handling JWTs](https://datatracker.ietf.org/doc/html/rfc7519). This provides robust utilities for creating, signing, encrypting, verifying, and decrypting JWTs through a clear, modular API. [#3](https://github.com/aura-stack-ts/auth/pull/3)

- Introduced the `@aura-stack/session` package to manage signed and encrypted JWTs via `encode` and `decode` functions, and to manage sessions using cookie helpers `setCookie` and `getCookie`. [#1](https://github.com/aura-stack-ts/auth/pull/1)
