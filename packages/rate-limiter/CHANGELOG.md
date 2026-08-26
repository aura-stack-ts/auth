# Changelog - `@aura-stack/rate-limiter`

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added support for passing context values to the `check()`, `peek()`, and `reset()` functions. The context can provide additional information for generating or validating rate-limit keys, particularly when a key is derived from external resources rather than directly from the request. [#269](https://github.com/aura-stack-ts/auth/pull/269)

- Added asynchronous support for the `keyGenerator` callback used to generate rate-limiter keys. The callback can now return either a synchronous value or a `Promise`, allowing asynchronous logic to be used when generating the key tracked by the rate limiter. [#269](https://github.com/aura-stack-ts/auth/pull/269)

### Fixed

- Fixed the dedicated `/algorithms/:algorithm` entry points, which now correctly resolve and expose their respective algorithm modules. [#269](https://github.com/aura-stack-ts/auth/pull/269)

---

## [0.1.1] - 2026-07-04

### Fixed

- Republished the package to correctly expose both the `/algorithms` entry point and individual `/algorithms/{algorithm}` entry points.
  > This release contains no code changes compared to `v0.1.0`; it only fixes the published package exports.

---

## [0.1.0] - 2026-07-04

### Added

- Added support for the `sliding-window` rate-limiter algorithm via the `createSlidingWindowAlgorithm` function. The function can be used standalone or integrated with the centralized `createRateLimiter` function. [#186](https://github.com/aura-stack-ts/auth/pull/186)

- Added support for the `leaky-bucket` rate-limiter algorithm via the `createLeakyBucketAlgorithm` function. The function can be used standalone or integrated with the centralized `createRateLimiter` function. [#186](https://github.com/aura-stack-ts/auth/pull/186)

- Added support for the `fixed-window` rate-limiter algorithm via the `createFixedWindowAlgorithm` function. The function can be used standalone or integrated with the centralized `createRateLimiter` function. [#185](https://github.com/aura-stack-ts/auth/pull/185)

- Introduced `createRateLimiter` function to create a rate limiter. Currently, the only supported algorithm is `token-bucket`, implemented by the `createTokenBucketAlgorithm` function. [#131](https://github.com/aura-stack-ts/auth/pull/131)
