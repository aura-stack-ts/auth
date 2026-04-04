---
name: use-jose-utilities
description: Use `createAuth(...).jose` utilities to encode/decode JWTs, sign/verify JWS, and encrypt/decrypt JWE in server-side auth flows. Trigger this skill whenever the user asks to generate session tokens, verify auth tokens, test protected routes with tokens, or use JOSE helpers exposed by Aura Auth.
license: MIT
---

# Use createAuth.jose Utilities

Use this skill to implement token utilities from the `jose` object returned by `createAuth`.

## Goal

Provide safe, correct server-side usage of:

- `jose.encodeJWT(...)`
- `jose.decodeJWT(...)`
- `jose.signJWS(...)`
- `jose.verifyJWS(...)`
- `jose.encryptJWE(...)`
- `jose.decryptJWE(...)`

## Preconditions

Before writing code, verify:

1. Auth instance exports `jose` from `createAuth(...)`.
2. `AURA_AUTH_SECRET` is configured.
3. `AURA_AUTH_SALT` is configured.

If `AURA_AUTH_SECRET` or `AURA_AUTH_SALT` is missing, stop and tell the user jose initialization will fail until both are present.

## Where to use these utilities

Use server-side only:

- API handlers
- Middleware
- Server actions
- Integration tests

Do not use `createAuth.jose` directly in browser-only client bundles.

## Standard auth instance shape

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

## Common implementation patterns

### 1) Create session-like token

```ts
const token = await jose.encodeJWT({
  sub: "user_123",
  email: "jane@example.com",
  name: "Jane Doe",
})
```

### 2) Validate token payload

```ts
const payload = await jose.decodeJWT(token)
```

### 3) Sign and verify a detached/auth utility payload

```ts
const signed = await jose.signJWS({ sub: "user_123" })
const verified = await jose.verifyJWS(signed)
```

### 4) Encrypt and decrypt payload

```ts
const encrypted = await jose.encryptJWE({ sub: "user_123" })
const decrypted = await jose.decryptJWE(encrypted)
```

## Testing pattern

When user asks for protected-route tests, use `jose.encodeJWT(...)` to mint a token and pass it as cookie/header according to the app convention.

Example cookie usage:

```ts
const sessionToken = await jose.encodeJWT({ sub: "johndoe", email: "johndoe@example.com" })
request.set("Cookie", [`aura-auth.session_token=${sessionToken}`])
```

## Output format

Use this structure:

```markdown
# JOSE Utility Setup

## 1. Preconditions Check

## 2. Files To Create/Update

## 3. JOSE Utility Code

## 4. Test/Verification Snippets

## 5. Failure Cases
```

## Failure handling guidance

If decode/verify/decrypt fails, explain likely root causes in this order:

1. Invalid or expired token.
2. `AURA_AUTH_SECRET` mismatch between token issuer and verifier.
3. `AURA_AUTH_SALT` mismatch.
4. Wrong token format used for the chosen method (JWT vs JWS vs JWE).

## Guardrails

- Keep implementation server-side.
- Reuse existing auth module instead of duplicating `createAuth` instances.
- Do not hardcode secrets.
- Prefer minimal edits aligned with framework conventions.
