# Changelog - `@aura-stack/jose`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added entropy verification for secrets passed to functions for signin, encrypting and derivation keys. The `createSecret` function ensures that the passed secret is secure with at least 32 characters and 6 bits of entropy per character. [#79](https://github.com/aura-stack-ts/auth/pull/79)

- Added configuration options for signature verification and decryption via `verifyJWS` and `decryptJWE` functions. [#48](https://github.com/aura-stack-ts/auth/pull/48)

- Added Key derivation support to `createJWT`, `encodeJWT` and `decodeJWT` functions which allows to pass the separated keys for signing and encrypting the JWTs using the `jws` and `jwe` properties as argument in the functions. [#45](https://github.com/aura-stack-ts/auth/pull/45)

---

## [0.1.0] - 2025-12-28

### Added

- Added salting support to `deriveKey` and `createDeriveKey` for HKDF-based key derivation from a secret value. [#30](https://github.com/aura-stack-ts/auth/pull/30)

- Introduced `deriveKey` and `createDeriveKey` for HKDF (HMAC-based Extract-and-Expand Key Derivation Function) so applications can derive multiple independent keys from a single secret without using the original secret directly. [#15](https://github.com/aura-stack-ts/auth/pull/15)

- Renamed the package from `@aura-stack/session` to `@aura-stack/jose` to focus on standardized JWT workflows: [signing (JWS)](https://datatracker.ietf.org/doc/html/rfc7515), [encrypting (JWE)](https://datatracker.ietf.org/doc/html/rfc7516), and [handling JWTs](https://datatracker.ietf.org/doc/html/rfc7519). The package now offers modular utilities to create, sign, encrypt, verify, and decrypt JWTs. [#3](https://github.com/aura-stack-ts/auth/pull/3)

- Introduced the `@aura-stack/session` package to manage signed and encrypted JWTs via `encode` and `decode`, and to manage sessions with cookie helpers `setCookie` and `getCookie`. [#1](https://github.com/aura-stack-ts/auth/pull/1)
