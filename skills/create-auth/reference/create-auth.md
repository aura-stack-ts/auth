---
name: create-auth
title: Create Auth Function
description: Implement production-ready Aura Auth createAuth configuration for any supported runtime or framework, including OAuth providers, session strategy, cookie security, routing, environment variables, identity schema, and deployment best practices.
---

# Purpose

Use this skill whenever a user asks to:

- set up authentication
- create an Aura Auth configuration
- initialize `createAuth`
- configure OAuth login
- add GitHub, GitLab, Google, Bitbucket, Discord, or custom OAuth providers
- configure JWT sessions
- wire auth routes
- configure authentication in Next.js, Express, Hono, Cloudflare Workers, Bun, Node.js, or similar runtimes
- debug Aura Auth configuration
- configure authentication environment variables
- customize identity schemas
- configure cookies, trusted origins, or proxies

Invoke this skill even if the user does not explicitly mention `@aura-stack/auth`, but their request is clearly about creating an Aura Auth server.

---

# Responsibilities

When invoked, produce a complete production-ready authentication setup instead of only answering the immediate question.

Unless the user explicitly requests otherwise, include:

- `createAuth()` configuration
- OAuth provider configuration
- required environment variables
- session configuration
- routing integration
- security recommendations
- explanation of why each option is used

Avoid placeholder implementations when a complete solution can be generated.

---

# Default Configuration

Unless the user specifies otherwise, generate:

```ts
createAuth({
  oauth: [],
  session: {
    strategy: "jwt",
    jwt: {
      mode: "sealed",
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
```

Use sealed JWT sessions as the default recommendation.

---

# OAuth

## Built-in providers

Prefer provider IDs whenever no customization is required.

Example:

```ts
oauth: ["github"]
```

or

```ts
oauth: ["github", "gitlab", "bitbucket"]
```

---

## Custom provider configuration

Use explicit provider configuration whenever the user needs:

- custom scopes
- custom endpoints
- enterprise OAuth
- self-hosted providers
- overridden client credentials

Generate the provider using Aura Auth's OAuth helpers whenever available.

Only fall back to manually implementing an `OAuthProvider` if necessary.

---

## Environment variables

Never hardcode secrets.

Prefer automatic environment variable loading.

Aura Auth automatically looks for

```
<PROVIDER>_CLIENT_ID
<PROVIDER>_CLIENT_SECRET
```

Example:

```
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

Do not manually pass these values unless customization is required.

---

# Secret Configuration

Prefer environment variables.

Recommend:

```
AURA_AUTH_SECRET
```

or

```
AUTH_SECRET
```

Never embed production secrets inside generated code.

If the secret is missing, mention that Aura Auth throws during initialization.

If the user asks how to generate one, recommend a cryptographically secure random 32-byte secret.

---

# Session Strategy

Unless requested otherwise:

- use JWT
- use sealed mode
- use a 7-day expiration

Recommend:

```ts
session: {
    strategy: "jwt",
    jwt: {
        mode: "sealed",
        maxAge: 60 * 60 * 24 * 7
    }
}
```

Only recommend signed or encrypted JWTs if the user explicitly needs them.

---

# Cookies

Only customize cookies when requested.

Explain that cookie overrides are security-sensitive.

Keep:

- httpOnly
- secure
- sameSite

using Aura Auth defaults unless the user has a specific requirement.

Avoid recommending custom cookie names unless necessary.

---

# Base URL

Recommend explicitly setting:

```ts
baseURL: "https://example.com"
```

for production deployments.

Explain that relying on header inference may fail behind proxies.

---

# Base Path

Unless requested otherwise:

```ts
basePath: "/auth"
```

The path must always begin with `/`.

---

# Trusted Origins

Only configure trusted origins if the application requires:

- multiple frontend origins
- CORS
- redirect validation

Prefer explicit origins over wildcard patterns.

Use wildcard matching only when the user's deployment requires it.

Warn that permissive origins create security risks.

---

# Trusted Proxy Headers

Recommend enabling only when the application is behind:

- Cloudflare
- Vercel
- Netlify
- Heroku
- AWS Load Balancer
- reverse proxy
- CDN

Do not enable for localhost or direct deployments.

---

# Identity Schema

If the user needs additional user fields:

- role
- organization
- permissions
- tenant
- username

extend `UserIdentity`.

Recommend supplying the inferred schema type to `createAuth`.

Example:

```ts
createAuth({
  identity: {
    schema,
  },
})
```

Use `strip` for unknown keys unless another behavior is explicitly requested.

---

# Logger

For development:

```ts
logger: true
```

For production, recommend either:

- the built-in logger with an appropriate log level
- a custom logger implementing Aura Auth's Logger interface

---

# Security Guidelines

Always recommend:

- environment variables for secrets
- explicit baseURL in production
- sealed JWT mode
- httpOnly cookies
- least-privilege OAuth scopes
- explicit trusted origins
- avoiding wildcard origins unless necessary

Warn users whenever they customize:

- cookies
- trusted origins
- trusted proxy headers
- cryptographic secrets

---

# Response Style

When generating code:

- produce complete working examples
- omit unrelated configuration
- follow Aura Auth best practices
- explain production recommendations
- avoid unnecessary customization

If the user asks about a specific option (for example `trustedOrigins`), explain only that option while preserving its security implications.

If the user asks to build an authentication server, generate the complete `createAuth` configuration instead of isolated snippets.
