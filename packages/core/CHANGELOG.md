# Changelog - `@aura-stack/auth`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Implemented timeout handling for `fetch` request used to communicate with external services during OAuth flows and user information retrieval. The implementation introduces a time limit for requests, ensuring they are canceled if they exceed the configured timeout. [#53](https://github.com/aura-stack-ts/auth/pull/53)

---

## [0.2.0] - 2026-1-09

### Added

- Added new patterns for automatic loading of environment variables for secure and OAuth credentials. The `AURA_` prefix is now optional for all environment variables required by Aura Auth. [#51](https://github.com/aura-stack-ts/auth/pull/51)

- Re-export the `encryptJWE` and `decryptJWE` functions for JWEs (Json Web Encryption) from the `jose` instance created from `createAuth` function. These functions are used internally for session and csrf token management and can be consumed for external reasons designed by the users. [#45](https://github.com/aura-stack-ts/auth/pull/45)

### Changed

- Updated `cookies` configuration option in `createAuth` function to support granular per-cookie settings for all internal cookies used by Aura Auth (e.g., `state`, `redirect_to`, `code_verifier`, `sessionToken`, and `csrfToken`) using the overrides object. Renamed `name` to `prefix` field to add to all of the cookies (without cookie prefixes). [#43](https://github.com/aura-stack-ts/auth/pull/43)

---

## [0.1.0] - 2025-12-28

### Added

- Added the `User` and `Session` types for user management. The `/session` endpoint now returns a `Session` object with `user` and `expires` fields, and the OAuth entry points re-export the types used by OAuth profiles. [#36](https://github.com/aura-stack-ts/auth/pull/36)

- Added support to build the user session from the OAuth provider `profile` function. The `/session` endpoint returns an object with `user` and `expires` fields. [#35](https://github.com/aura-stack-ts/auth/pull/35)

- Introduced the experimental `trustedProxyHeaders` configuration to infer the request origin from proxy headers such as `X-Forwarded-Proto`, `X-Forwarded-Host`, and `Forwarded`. [#34](https://github.com/aura-stack-ts/auth/pull/34)

- Added the `X (Twitter)` OAuth provider to the supported integrations in Aura Auth. [#33](https://github.com/aura-stack-ts/auth/pull/33)

- Added the `Spotify` OAuth provider to the supported integrations in Aura Auth. [#32](https://github.com/aura-stack-ts/auth/pull/32)

- Introduced the optional `AURA_AUTH_SALT` environment variable for HKDF salting when deriving keys for signing and encryption JWTs and CSRF tokens. [#30](https://github.com/aura-stack-ts/auth/pull/30)

- Added the `GitLab` OAuth provider to the supported integrations in Aura Auth. [#28](https://github.com/aura-stack-ts/auth/pull/28)

- Added the `Discord` OAuth provider to the supported integrations in Aura Auth. [#27](https://github.com/aura-stack-ts/auth/pull/27)

- Added the `Figma` OAuth provider to the supported integrations in Aura Auth. [#26](https://github.com/aura-stack-ts/auth/pull/26)

- Added the `Bitbucket` OAuth provider to the supported integrations in Aura Auth. [#25](https://github.com/aura-stack-ts/auth/pull/25)

- Introduced the `basePath` configuration option in `createAuth` to set a custom base path for locating the Aura Auth instance; the default remains `/auth`. [#24](https://github.com/aura-stack-ts/auth/pull/24)

- Introduced the `secret` configuration option in `createAuth` to override the `AURA_AUTH_SECRET` environment variable by providing the secret directly. [#22](https://github.com/aura-stack-ts/auth/pull/22)

- Added support for the `redirect_to` search parameter in `/signIn/:oauth` and `/signOut` endpoints to redirect users after completion. This overrides `Referer` and `Origin` when inferring where to redirect. [#20](https://github.com/aura-stack-ts/auth/pull/20)

- Implemented `createDeriveKey` from `@aura-stack/jose` for HKDF-based key derivation so the original secret is never used directly for signing or encryption. [#16](https://github.com/aura-stack-ts/auth/pull/16)

- Added the `/csrfToken` endpoint for CSRF token generation via signed JWTs with unpredictable values. The `/signOut` endpoint requires a valid `csrfToken` or the request is rejected. [#14](https://github.com/aura-stack-ts/auth/pull/14)

- Added validations to mitigate open redirect attacks by validating `Referer` and `Origin` headers and allowing only matching origins and relative redirect paths. [#12](https://github.com/aura-stack-ts/auth/pull/12)

- Added support for **PKCE (Proof Key for Code Exchange)** in the OAuth authorization workflows (`/authorization` and `/access_token`) with `code_challenge`, `code_challenge_method` (only `256`), and `code_verifier`, following [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636). [#11](https://github.com/aura-stack-ts/auth/pull/11)

- Introduced the `cookie` configuration option in `createAuth` to manage cookie name, prefixes (`__Secure-`, `__Host-`), and cookie options, following [Cookie HTTP State Management](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html). [#10](https://github.com/aura-stack-ts/auth/pull/10)

- Implemented the `/signOut` endpoint for session revocation, following the [OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009) specification. [#9](https://github.com/aura-stack-ts/auth/pull/9)

- Added support for the `OAuthUserProfile` object in the `/session` response, including `sub`, `email`, `name`, `image`, `integrations`, and `version`. Introduced the `redirect_to` cookie to replace the previous `original_uri` cookie. [#8](https://github.com/aura-stack-ts/auth/pull/8)

- Added support for the `error` and `error_description` properties to standardize error handling in accordance with [OAuth 2.0 RFC 6749 §5.2](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2). These fields describe errors returned by the application or by third-party authorization servers. [#2](https://github.com/aura-stack-ts/auth/pull/2)

- Introduced the `@aura-stack/auth` package, which implements the OAuth workflow and exposes the `/signIn/:provider`, `/callback/:provider`, and `/session` endpoints. The package uses `@aura-stack/router` to define routes via `createAuth`, includes OAuth provider configuration, and ships with a default GitHub provider. [#1](https://github.com/aura-stack-ts/auth/pull/1)
