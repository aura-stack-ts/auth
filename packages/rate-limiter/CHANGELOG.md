# Changelog - `@aura-stack/rate-limiter`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added support for the `fixed-window` rate-limiter algorithm via the `createFixedWindow` function. The function can be used standalone or integrated with the centralized `createRateLimiter` function. [#185](https://github.com/aura-stack-ts/auth/pull/185)

- Introduced `createRateLimiter` function to create a rate limiter. Currently, the only supported algorithm is `token-bucket`, implemented by the `createTokenBucket` function. [#131](https://github.com/aura-stack-ts/auth/pull/131)
