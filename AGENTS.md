# AGENTS.md

Guidance for AI coding agents working in the **Aura Stack Auth** monorepo (`aura-stack-ts/auth`).

Human contributors should refer to [CONTRIBUTING.md](./CONTRIBUTING.md) and the [official documentation](https://aura-stack-auth.vercel.app/docs).

## Project Overview

Aura Stack Auth is an open-source, **framework-agnostic**, **runtime-agnostic**, and **type-safe** authentication and authorization library for TypeScript. It is built on the Web `Request` and `Response` APIs and inspired by Auth.js.

Key features include OAuth 2.0, OpenID Connect (OIDC), JWT/JWS/JWE utilities, secure cookie management, and stateless sessions, with stateful and hybrid session capabilities evolving alongside the project.

- **Repository:** https://github.com/aura-stack-ts/auth
- **Issues:** https://github.com/aura-stack-ts/auth/issues
- **Documentation:** https://aura-stack-auth.vercel.app
- **Contributing guide:** https://aura-stack-auth.vercel.app/docs/contributing
- **License:** MIT

## Tech Stack and Requirements

- **Runtime:** Node.js `>=22`
- **Package manager:** pnpm `10.15.0`, pinned through `packageManager`. Do not use npm or Yarn.
- **Language and modules:** TypeScript `^5.9`, ESM (`"type": "module"`).
- **Imports:** Use the `@/` alias within packages and explicit `.ts` extensions where required by the existing configuration.
- **Monorepo:** pnpm workspaces and Turborepo (`pnpm-workspace.yaml`, `turbo.json`).
- **Build:** tsdown.
- **Testing:** Vitest, including type tests (`*.test-d.ts`).
- **Linting and formatting:** oxlint and oxfmt.
- **Schema validation:** Zod (v3 and v4 through workspace catalogs), Valibot, and other supported validators through the identity and validation layers.

Before introducing a dependency, changing a tool configuration, or modifying a shared convention, inspect the relevant package configuration and follow existing patterns.

## Repository Structure

The repository is a pnpm workspace orchestrated by Turborepo.

### Repository Layout

```text
.
├── apps/                 # Demo and runtime-specific applications
├── configs/              # Shared tooling configurations
├── docs/                 # Fumadocs documentation and MDX content
├── packages/
│   ├── core/              # Core authentication library
│   ├── jose/              # JWT/JWS/JWE utilities
│   ├── rate-limiter/      # Rate-limiting package
│   ├── <framework>/       # Framework-specific integrations
│   ├── prisma/            # Prisma adapter
│   ├── integration/       # Framework integration template
│   └── shared/            # Shared scripts and internal utilities
├── skills/                # Reusable agent skills
├── turbo.json
├── pnpm-workspace.yaml
├── .oxlintrc.json
└── .oxfmtrc.json
```

The `apps/` directory contains examples for supported frameworks and runtimes, such as Next.js, Bun, Cloudflare Workers, Deno, Oak, and Supabase.

### Core Package Structure

The following describes the main areas of the core package. Check the current source tree before relying on specific paths or filenames.

```text
src/
├── @types/        # Public and internal types
├── actions/       # Authentication endpoint actions
├── client/        # createAuthClient and typed client APIs
├── config/        # Configuration normalization and validation
├── errors/        # AuraError and the centralized error catalog
├── identity/      # Identity schema validation
├── oauth/         # Built-in OAuth providers
├── router/        # Routing, request context, and hooks
├── session/       # Session strategies, cookies, and session utilities
├── shared/        # Shared crypto, security, OIDC, logging, and utilities
├── validator/     # Schema validator registry
├── createAuth.ts  # Main authentication factory
└── jose.ts        # JOSE-related functionality
```

### Package Dependencies

The intended high-level dependency relationships are:

```text
@aura-stack/auth
├── @aura-stack/jose
├── @aura-stack/shared
└── @aura-stack/router

@aura-stack/<framework>
└── @aura-stack/auth
```

Verify the actual workspace dependencies before changing package boundaries or introducing new dependencies.

## Commands

Run commands from the repository root unless a package-level command is explicitly required. Check the root and package `package.json` files for the authoritative scripts when a command is missing or behaves differently from this guide.

### Root Commands

| Command                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| `pnpm install`             | Install workspace dependencies.             |
| `pnpm build`               | Build packages and applications.            |
| `pnpm build:packages`      | Build packages only.                        |
| `pnpm dev`                 | Start the configured development servers.   |
| `pnpm dev:core`            | Run the core package in watch mode.         |
| `pnpm dev:docs`            | Start the documentation development server. |
| `pnpm test`                | Run package tests.                          |
| `pnpm test:coverage`       | Run tests with coverage.                    |
| `pnpm type-check`          | Run TypeScript checks.                      |
| `pnpm type-check:packages` | Type-check packages only.                   |
| `pnpm lint`                | Run lint checks.                            |
| `pnpm lint:fix`            | Run lint checks and apply supported fixes.  |
| `pnpm format`              | Format supported files.                     |
| `pnpm format:check`        | Check formatting without applying changes.  |

### Package-Level Commands

Run these commands from the relevant package directory, if defined by that package.

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Run the package in watch mode.                         |
| `pnpm build`         | Build the package.                                     |
| `pnpm test`          | Run package tests.                                     |
| `pnpm test:watch`    | Run tests in watch mode.                               |
| `pnpm test:coverage` | Run tests with coverage.                               |
| `pnpm test:types`    | Run type-level tests.                                  |
| `pnpm clean`         | Remove the package's build output.                     |
| `pnpm clean:cts`     | Remove generated `.d.cts` files from the build output. |

Do not assume every script exists in every package. Verify its `package.json` before running it.

## Conventions

### Code Style and Imports

- Use **oxfmt** for formatting and **oxlint** for linting. Do not introduce Prettier or ESLint configurations unless explicitly required by the task.
- Use `import type` for type-only imports.
- Use the `@/` alias within a package where supported. Follow existing import conventions and use relative imports where the alias is unavailable or inappropriate.
- Follow the repository's ESM and TypeScript conventions, including explicit `.ts` extensions where required.
- Document public APIs and types with TSDoc. Existing configuration types contain detailed JSDoc that also supports documentation generation.
- Prefer small, focused changes that preserve existing APIs and runtime compatibility.

### Error Handling

- Use the `AuraError` base class and centralized error definitions for errors that belong to the library's error system.
- Add new error codes to the error catalog, currently identified as `errors/catalog.ts` in the core package. Follow the existing naming convention, such as `INVALID_BASE_PATH_CONFIG`.
- Avoid ad hoc errors or string-only error messages when a structured library error is appropriate.
- Never expose secrets, tokens, authorization codes, cookie values, or sensitive provider responses through error messages or logs.

### Configuration and Environment Variables

- The `secret` configuration is required, either through the supported configuration option or an environment variable.
- Environment variables used by the library include:
  - `AURA_AUTH_SECRET` / `AUTH_SECRET`
  - `AURA_AUTH_SALT` / `SALT`
  - `AUTH_DEBUG`
  - `AUTH_LOG_LEVEL`
  - `TRUSTED_ORIGINS`
  - `TRUSTED_PROXY_HEADERS`
- Read environment variables through the shared environment helper in library code. Do not access `process.env` directly unless the existing runtime-specific implementation explicitly requires it.
- The default `basePath` is `/auth`. Follow the existing normalization and validation rules, including the leading-slash requirement and trailing-slash handling.
- Never commit real secrets or `.env` files. Use placeholders in documentation and tests.

### Adding an OAuth Provider

When adding a built-in OAuth provider, follow these steps:

1. **Implement the provider.** Add the provider under `packages/core/src/oauth/`, following an existing provider such as `github.ts` or `x.ts`.
2. **Export the provider.** Update `oauth/index.ts` or the relevant entry point, following the existing export conventions.
3. **Register the provider.** Update the built-in provider registry and associated types so that `oauth: ["<id>"]` is correctly supported.
4. **Add tests.** Cover provider configuration, OAuth behavior, and user-info or profile mapping as applicable. Place tests in the appropriate core test directory.
5. **Update documentation.** Add a provider page under `docs/`, following the existing provider documentation structure. Verify the callback URL format against the implementation; existing examples may use `http://localhost:3000/auth/callback/<id>`.
6. **Update navigation.** Add the new page to the appropriate provider navigation `pages` list.
7. **Update the changelog.** Add an entry to the relevant package's `CHANGELOG.md` for user-visible changes.

Do not assume every provider uses the same scopes, profile fields, endpoints, or OAuth/OIDC behavior. Follow the provider's actual protocol and implementation.

### Testing

- **Test framework:** Vitest.
- **Unit and integration tests:** Follow the existing `*.test.ts` naming and directory conventions.
- **Type-level tests:** Use `*.test-d.ts` where applicable.
- **Fixtures:** Reuse existing fixtures and test helpers rather than duplicating setup.
- **Runtime compatibility:** When changing core functionality, consider the supported runtimes and test relevant runtime-specific behavior.
- **Security-sensitive changes:** Add regression tests for both expected behavior and relevant failure cases.

Run the narrowest relevant test suite during development, then run broader checks when practical.

### Documentation

- **Framework:** Fumadocs with MDX content.
- **Development server:** `pnpm dev:docs`.
- Follow the structure, terminology, and code examples used by existing documentation pages.
- Keep documentation consistent with the actual public API, defaults, validation behavior, and supported integrations.
- Update related API references, navigation, examples, and guides when a public-facing change requires it.

### Changelogs and Releases

- Published packages maintain their own `CHANGELOG.md`. Add entries for user-visible changes to the affected package and include the relevant pull request link when available.
- Release pull requests use the `chore(release): bump package versions` convention and update the relevant package versions, changelogs, and JSR configuration such as `deno.json`, where applicable.
- Do not bump package versions in feature or bug-fix pull requests unless the task explicitly requires it.

### Commits and Pull Requests

- Use Conventional Commits with a relevant scope, for example:
  - `feat(core): add provider support`
  - `fix(ci): correct workflow configuration`
  - `refactor(core): simplify session handling`
  - `chore(release): bump package versions`
  - `docs(core): clarify configuration`
  - `test(core): cover validation edge cases`
- The default branch is `master`. Open pull requests against `master` unless repository settings or task instructions specify otherwise.
- Keep changes focused and describe their impact clearly.
- Explicitly identify breaking changes, security-sensitive changes, and any behavior that requires migration.

## Security Rules for Agents

Treat changes involving sessions, cookies, JWT/JWS/JWE, CSRF, OAuth state, redirects, trusted origins, or trusted proxy headers as **security-sensitive**.

- Make the smallest reasonable change and add tests covering relevant security properties and failure cases.
- Call out security-sensitive behavior in the pull request description.
- Never log or print secrets, tokens, authorization codes, or cookie values.
- Do not disable schema validation, origin checks, entropy checks, or other security controls to make tests pass.
- Do not introduce runtime dependencies into `@aura-stack/auth` without a clear justification. The core package is intended to remain lightweight and portable.
- Report suspected vulnerabilities privately to `aurastackjs@gmail.com` rather than disclosing them in public issues.

## Don't

- Edit generated build output such as `dist/` or generated `*.gen.ts` files.
- Manually edit the lockfile; use pnpm commands to update dependencies.
- Introduce Node.js-only APIs into runtime-agnostic core code.
- Rename or remove public exports without explicitly identifying the breaking change.
- Change `packageManager`, `engines`, or workspace catalog versions unless required by the task.
- Add dependencies or configuration files without checking existing workspace conventions first.

## Agent Skills

Reusable agent skills for tasks such as setup, OAuth provider development, and security auditing live in [`skills/`](./skills).

Before starting a task, check whether a skill matches the requested work and follow its `SKILL.md` instructions when applicable.
