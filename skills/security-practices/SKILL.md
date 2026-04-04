---
name: security-practices
description: Apply security best practices for @aura-stack/auth configuration, including .env handling, git-safe secret management, cookie hardening, trusted proxy/origin controls, and secure session/JWT strategy design. Use this skill whenever a user asks about production-safe auth configuration or security-critical options in Aura Auth.
license: MIT
---

# Security Practices For Aura Auth

Use this skill to produce secure, production-ready configuration guidance for `@aura-stack/auth`.

## Scope

Cover all critical security topics:

1. `.env` secure setup and git tracking prevention.
2. Safe handling of `secret` and `salt` values.
3. Cookie hardening with safest practical options.
4. Correct usage of `trustedProxyHeaders`.
5. `trustedOrigins` strategy (static, dynamic, wildcard).
6. Secure `session` strategy design with JWT best practices.
7. JWT mode analysis (`sealed`, `signed`, `encrypted`) and app-fit recommendation.
8. `issuer`, `audience`, `maxExpiration`, `maxAge`, and `expirationStrategy` guidance.

## Mandatory docs and source check

Before proposing changes, read:

- `docs/src/content/docs/configuration/env.mdx`
- `docs/src/content/docs/configuration/options.mdx`
- `docs/src/content/docs/concepts/security-model.mdx`
- `docs/src/content/docs/guides/cookie-management.mdx`
- `packages/core/src/@types/config.ts`
- `packages/core/src/@types/session.ts`

If the website docs are used directly, reference equivalent routes:

- `/docs/configuration/env`
- `/docs/configuration/options`
- `/docs/concepts/security-model`
- `/docs/guides/cookie-management`

## Inputs to collect first

Ask for:

- Deployment topology (direct server, reverse proxy, CDN, load balancer).
- Runtime/framework and environment split (dev/staging/prod).
- Session security requirements (confidentiality only, integrity only, both).
- Token lifetime expectations and compliance constraints.
- Whether multi-service verification is required (for issuer/audience planning).

## .env and git safety requirements

Always enforce:

1. Use `.env` only for local development.
2. Ensure `.env` and `.env.*` are gitignored.
3. Keep `.env.example` with placeholders only.
4. Never commit real secrets in repo history.
5. Recommend secret managers in production.

Minimum secure variables:

```env
AURA_AUTH_SECRET=""
AURA_AUTH_SALT=""
```

Generation examples:

```bash
openssl rand -base64 32
```

or

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Passing `secret` safely

Preferred order:

1. Load from environment (`AURA_AUTH_SECRET`) and do not hardcode.
2. Avoid embedding literal secret strings in source files.
3. Rotate secrets only with explicit session invalidation planning.

If user insists on `secret` in config, warn and offer env-based alternative.

## Cookie hardening best practices

Default recommendation:

- Keep secure defaults from Aura Auth.
- Override only when required.
- Use strictest feasible cookie strategy in production.

Guidance by strategy:

- `host` (strongest): prefer for highly sensitive apps on stable host, HTTPS only.
- `secure`: strong default for most production apps.
- `standard`: development-only or constrained legacy use.

Always keep/verify:

- `httpOnly: true` for sensitive cookies.
- `sameSite: "lax"` minimum; use `"strict"` where UX allows.
- `secure: true` in production HTTPS contexts.

Avoid broad `domain` overrides unless cross-subdomain sharing is required and reviewed.

## trustedProxyHeaders guidance

Enable `trustedProxyHeaders: true` only when ALL are true:

1. App is behind a trusted reverse proxy/CDN/load balancer.
2. Forwarded headers are sanitized/controlled by your infra.
3. You understand spoofing implications if misconfigured.

Do NOT enable when:

- Running localhost/direct internet without trusted proxy.
- Proxy chain is unknown or partially trusted.
- Header rewriting policy is unclear.

## trustedOrigins best practices

### Static allowlist (preferred)

Use explicit origins for known frontends:

```ts
trustedOrigins: ["https://app.example.com", "https://admin.example.com", "http://localhost:3000"]
```

### Dynamic allowlist (controlled multi-tenant scenarios)

Only allow origins derived from trusted business logic:

```ts
trustedOrigins: (request) => {
  const origin = request.headers.get("origin")
  if (origin && origin.endsWith(".example.com")) return [origin]
  return []
}
```

### Wildcards (high-risk, minimize)

Allowed patterns include:

- `https://*.example.com`
- `https://example.com:*`
- `https://*.example.com:*`

Rules:

- Prefer explicit hosts before wildcards.
- Restrict by protocol (`https`) and domain scope.
- Never use broad catch-all semantics.

## Session strategy best practices

Aura Auth currently uses JWT strategy (`session.strategy: "jwt"`).

Baseline secure template:

```ts
session: {
  strategy: "jwt",
  jwt: {
    mode: "sealed",
    maxAge: 60 * 60 * 24 * 7,
    issuer: "https://auth.example.com",
    audience: ["https://api.example.com"],
    maxExpiration: 60 * 60 * 24 * 30,
    expirationStrategy: "absolute",
  },
}
```

## JWT mode analysis and recommendation

### `sealed` (default, recommended for most apps)

- Signed + encrypted semantics.
- Protects integrity and confidentiality.
- Best default for web apps and APIs with browser cookies.

### `signed`

- Integrity only; payload visible.
- Use when intermediaries/services must read claims without decrypting.
- Not ideal for sensitive claim sets.

### `encrypted`

- Confidentiality only; no signature integrity layer.
- Use only with strong justification and architecture review.

Decision rule:

- Choose `sealed` unless there is a clear interoperability/performance requirement.

## issuer, audience, maxExpiration, and expiration design

- `issuer`: set canonical auth issuer URL.
- `audience`: set explicit service audience(s); avoid overly broad audiences.
- `maxAge`: session lifetime per token.
- `maxExpiration`: absolute cap to prevent indefinite extension.
- `expirationStrategy`:
  - `absolute`: hard stop after max window (security-first default).
  - `rolling`: extends active sessions; use with strict caps and monitoring.

Best-practice defaults:

- consumer web app: `sealed`, 7d maxAge, absolute 30d maxExpiration.
- high-risk admin app: `sealed`, shorter maxAge (8-24h), strict audience, absolute expiration.
- machine-oriented internal service: evaluate signed vs sealed based on confidentiality requirements.

## Output format

Use this exact structure:

```markdown
# Aura Auth Security Plan

## 1. Threat-Sensitive Context

## 2. .env and Git Safety

## 3. Critical Config Recommendations

## 4. Cookie Security Profile

## 5. trustedProxyHeaders Decision

## 6. trustedOrigins Policy (Static/Dynamic/Wildcard)

## 7. Session and JWT Strategy Decision

## 8. Final Hardened Config Example

## 9. Validation Checklist
```

## Validation checklist

1. `.env` is ignored by git and `.env.example` has placeholders only.
2. `AURA_AUTH_SECRET` and `AURA_AUTH_SALT` are present and high entropy.
3. Cookies use secure strategy for production and preserve `httpOnly`.
4. `trustedProxyHeaders` is enabled only in trusted-proxy deployments.
5. `trustedOrigins` blocks untrusted redirects/origins.
6. JWT mode choice is justified and documented.
7. `issuer`, `audience`, `maxAge`, and `maxExpiration` are explicitly set.
8. Expiration strategy aligns with business risk and compliance.

## Guardrails

- Never print or commit real production secrets.
- Do not weaken cookie/security settings for convenience in production.
- Prefer least privilege in origins and token audience.
- Explain tradeoffs before recommending less-secure alternatives.
