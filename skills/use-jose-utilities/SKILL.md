---
name: use-jose-utilities
description: Implement production-safe usage of `createAuth(...).jose` utilities for JWT, JWS, and JWE operations in Aura Auth server-side flows. Use this skill whenever users ask to mint or inspect auth tokens, verify signed tokens, encrypt/decrypt token payloads, seed protected-route tests with tokens, or troubleshoot JOSE behavior in Aura Auth.
license: MIT
---

# Use JOSE Utilities

Use this skill to implement token utilities from the `jose` object returned by `createAuth` in secure server-side contexts.

Docs home: https://aura-stack-auth.vercel.app/docs/

## High-Confidence Trigger Guidance

Use this skill when user intent includes any of these:

- "generate session token", "mint token", or "seed auth token for tests".
- "verify token" or "validate signed token" in Aura Auth.
- "encrypt token payload" or "decrypt auth payload".
- "how do I use jose from createAuth".
- "protected route tests with auth token/cookie" in Aura Auth projects.

Do not use this skill for generic JWT libraries unrelated to Aura Auth, or browser-only token logic.

## Output Contract (Strict)

Always return all sections below unless the user explicitly narrows scope:

1. Preflight findings for auth module shape and JOSE availability.
2. Required environment check (`AURA_AUTH_SECRET`, `AURA_AUTH_SALT`).
3. Server-safe implementation plan for requested JOSE operation(s).
4. Code snippet(s) tailored to the user runtime and file layout.
5. Safe usage notes (where JOSE should and should not run).
6. Failure-mode guidance ordered by likelihood.
7. Verification checklist.
8. Troubleshooting section.

## Mandatory Preflight Discovery (Required)

Before editing files, collect or detect:

1. Where `createAuth(...)` is defined and exported.
2. Whether the exported object includes `jose`.
3. Whether `AURA_AUTH_SECRET` and `AURA_AUTH_SALT` are configured.
4. Whether `identity.schema` is configured and relevant to payload shape.
5. Which server context is requested (API route, middleware, server action, tests).

If critical inputs are missing, ask concise follow-up questions before editing files.

---

## Goal

Provide safe, correct server-side usage of:

- `jose.encodeJWT(...)`
- `jose.decodeJWT(...)`
- `jose.signJWS(...)`
- `jose.verifyJWS(...)`
- `jose.encryptJWE(...)`
- `jose.decryptJWE(...)`

## Secret and Initialization Guard (Mandatory)

Before writing JOSE code, verify all three conditions:

1. The auth instance exports `jose` from `createAuth(...)`.
2. `AURA_AUTH_SECRET` is set.
3. `AURA_AUTH_SALT` is set.

If either secret variable is missing, stop and return a blocking message explaining JOSE initialization will fail until both values exist.

If the user requests it, use the helper script from the create-auth skill to fill missing values:

- `skills/create-auth/scripts/update-auth-env.sh`

Only run secret-generation helpers with explicit user approval.

## Safe Runtime Boundaries

Allowed contexts:

- API handlers
- Middleware
- Server actions
- Integration tests
- CLI/admin scripts that run server-side only

Disallowed context:

- Browser-only bundles and client components

Never instruct users to expose raw secrets or JOSE internals to frontend code.

## Standard Auth Instance Shape

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github"],
  basePath: "/api/auth",
})
```

## Implementation Patterns

### 1) Encode JWT payload

```ts
const token = await jose.encodeJWT({
  sub: "user_123",
  email: "jane@example.com",
  name: "Jane Doe",
})
```

### 2) Decode JWT payload

```ts
const payload = await jose.decodeJWT(token)
```

### 3) Sign and verify JWS payload

```ts
const signed = await jose.signJWS({ sub: "user_123" })
const verified = await jose.verifyJWS(signed)
```

### 4) Encrypt and decrypt JWE payload

```ts
const encrypted = await jose.encryptJWE({ sub: "user_123" })
const decrypted = await jose.decryptJWE(encrypted)
```

## Testing Pattern for Protected Routes

When user asks for route/integration tests, mint a token and pass it via the app's expected cookie/header contract.

Example cookie setup:

```ts
const sessionToken = await jose.encodeJWT({
  sub: "johndoe",
  email: "johndoe@example.com",
})

request.set("Cookie", [`aura-auth.session_token=${sessionToken}`])
```

## identity.schema Impact

If `identity.schema` is configured, explain that token-related payload expectations in app code should stay aligned with the schema fields and validation behavior.

Do not invent schema fields or claim automatic claim transformation unless the code/docs confirm it.

## Output Template (Use This Structure)

```markdown
# JOSE Utility Setup

## 1. Preconditions Check

## 2. Plan and File Changes

## 3. JOSE Utility Snippets

## 4. Test and Verification Snippets

## 5. Troubleshooting and Failure Cases
```

## Failure Handling Guidance

If decode/verify/decrypt fails, diagnose in this order:

1. Invalid, malformed, or expired token input.
2. `AURA_AUTH_SECRET` mismatch between issuer and verifier.
3. `AURA_AUTH_SALT` mismatch.
4. Wrong method-token pairing (JWT vs JWS vs JWE).
5. Runtime/context mismatch (server code accidentally running in client bundle).

## Verification Checklist

1. Auth module exports `jose` and imports resolve cleanly.
2. Required env vars are present in runtime.
3. Requested JOSE operation returns expected output.
4. Protected route or test flow accepts generated token format.
5. No secret leakage in logs, commits, or client code.

## Guardrails

- Keep all JOSE operations server-side.
- Reuse existing auth module; do not duplicate `createAuth` instances.
- Do not hardcode `AURA_AUTH_SECRET` or `AURA_AUTH_SALT` in source.
- Prefer minimal, reversible edits aligned with project conventions.
- Explain why each modified file is needed.
