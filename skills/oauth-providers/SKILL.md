---
name: oauth-providers
description: Configure OAuth providers for @aura-stack/auth end-to-end, including built-in and custom providers, provider environment variables, trusted origins, and identity schema implications. Use this skill whenever users ask to add providers, troubleshoot credential/config issues, or validate OAuth profile mapping behavior.
license: MIT
---

# Setup OAuth Providers For Aura Auth

Use this skill to configure OAuth providers end-to-end for `@aura-stack/auth`.

Docs home: https://aura-stack-auth.vercel.app/docs/

---

## When to use

Use this skill whenever a user asks about setting up OAuth providers in Aura Auth, including built-in provider configuration, custom provider setup, environment variable requirements, trusted origins configuration, or the impact of `identity.schema` on OAuth profiles.

---

## Output Contract (Strict)

Always return ALL of the following unless explicitly scoped otherwise:

1. Setup plan customized to the provider(s), framework/runtime, and project structure.
2. Built-in or custom provider configuration snippet using `createAuth`.
3. Exact env variable requirements for each configured provider.
4. `trustedOrigins` recommendation tailored to the user's domains.
5. `identity.schema` impact explanation when identity mapping is in scope.
6. Verification checklist.
7. Troubleshooting section for common OAuth setup failures.

---

## What this skill must cover

1. How to configure built-in providers in `createAuth`.
2. How to configure custom OAuth providers.
3. Environment variable requirements and naming patterns.
4. What changes when `identity.schema` is configured.
5. How to configure `trustedOrigins` safely.
6. Where to read official docs for each topic.

---

## Mandatory Preflight Discovery (Required)

Before writing files, collect or detect:

1. Runtime/framework and route location of the auth instance.
2. Existing auth module (`createAuth`) and current `oauth` config.
3. Provider target list and whether each one is built-in or custom.
4. Callback/public app URL and expected redirect behavior.
5. Current env values in `.env*` files for provider credentials and auth secrets.
6. Whether `identity.schema` is already configured.

If critical inputs are missing, ask concise follow-up questions before editing files.

---

## Inputs to collect first

Ask for missing details:

- Target framework/runtime.
- OAuth provider(s) to enable.
- Whether provider is built-in or custom.
- App callback/base URL.
- Existing auth file path.
- Whether user already has provider client credentials.

---

## Built-in provider setup

### Minimal setup with provider IDs

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: ["github", "gitlab"],
  basePath: "/api/auth",
})
```

### Provider factory setup

```ts
import { createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth"

export const { handlers, jose, api } = createAuth({
  oauth: [
    builtInOAuthProviders.github({
      authorize: {
        url: "https://github.com/login/oauth/authorize",
        params: { scope: "read:user user:email" },
      },
    }),
  ],
})
```

If the project already imports from `@aura-stack/auth/oauth/index`, preserve that style.

---

## Supported built-in providers (source-of-truth: code)

- github
- bitbucket
- figma
- discord
- gitlab
- spotify
- x
- strava
- mailchimp
- pinterest
- twitch
- notion
- dropbox
- atlassian

Validation rule:

- If unsure, verify provider IDs against `builtInOAuthProviders` in source before proposing changes.

---

## Custom provider setup

Use a custom provider object in `oauth` when provider is not built-in.

```ts
import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
  oauth: [
    {
      id: "custom",
      name: "Custom Provider",
      authorize: {
        url: "https://custom.example.com/oauth/authorize",
        params: {
          scope: "profile email",
          responseType: "code",
        },
      },
      accessToken: "https://custom.example.com/oauth/token",
      userInfo: "https://custom.example.com/api/user",
      profile(profile) {
        return {
          sub: String(profile.id),
          email: profile.email,
          name: profile.name,
        }
      },
    },
  ],
  basePath: "/api/auth",
})
```

When adding custom providers:

- Require unique `id` values (duplicate IDs are invalid).
- Ensure `authorize`, `accessToken`, and `userInfo` are valid endpoints.
- Ensure returned profile has a stable unique `sub`.
- Ensure `id` is lowercase and maps to env keys consistently.

---

## Environment variable rules

Explain and apply Aura Auth env resolution order:

1. `AURA_AUTH_{KEY}`
2. `AURA_{KEY}`
3. `AUTH_{KEY}`
4. `{KEY}`

OAuth provider keys follow:

- `{PROVIDER}_CLIENT_ID`
- `{PROVIDER}_CLIENT_SECRET`

Examples:

```env
AURA_AUTH_GITHUB_CLIENT_ID=""
AURA_AUTH_GITHUB_CLIENT_SECRET=""
```

If credentials are missing, clearly state which env keys are required for each provider.

When OAuth provider setup is requested, also check baseline auth secrets:

```env
AURA_AUTH_SECRET=""
AURA_AUTH_SALT=""
```

Do not auto-generate secrets without user consent.

---

## trustedOrigins setup

Always recommend explicit allowlists.

Static example:

```ts
trustedOrigins: ["https://app.example.com", "http://localhost:3000"]
```

Dynamic example:

```ts
trustedOrigins: (request) => {
  const origin = request.headers.get("origin")
  if (origin && origin.endsWith(".example.com")) return [origin]
  return []
}
```

Wildcard examples (use cautiously):

- `https://*.example.com`
- `https://example.com:*`
- `https://*.example.com:*`

Warn that overly broad patterns can introduce open redirect/CORS risk.

Prefer exact origin allowlists first.

## identity.schema behavior (must explain)

When `identity.schema` is configured:

- OAuth profile mapping is validated against the provided schema.
- Unknown keys behavior depends on `identity.unknownKeys`:
  - `strip` (default): remove unknown fields.
  - `passthrough`: keep unknown fields.
  - `strict`: throw on unknown fields.
- `skipValidation: true` disables schema validation (use only when explicitly requested).
- Type inference should use `createAuth<Shape>` for better TS support.

Example:

```ts
import { createAuth, UserIdentity, type InferShape } from "@aura-stack/auth"
import { z } from "zod"

const schema = UserIdentity.extend({
  role: z.enum(["user", "admin"]),
})

type Shape = InferShape<typeof schema>

export const { handlers, jose, api } = createAuth<Shape>({
  oauth: ["github"],
  identity: {
    schema,
    unknownKeys: "strip",
  },
})
```

---

## Output Template (Use This Structure)

Use this response structure:

```markdown
# Aura OAuth Provider Setup

## 1. Summary

## 2. Provider Plan

## 3. Files To Create/Update

## 4. Environment Variables

## 5. trustedOrigins Configuration

## 6. identity.schema Impact

## 7. Verification Checklist

## 8. Troubleshooting
```

Troubleshooting must include at least:

- Missing provider credentials (`{PROVIDER}_CLIENT_ID`, `{PROVIDER}_CLIENT_SECRET`).
- Callback URL mismatch between provider dashboard and app.
- Untrusted origin or invalid redirect target.
- Duplicate provider IDs.

---

## Verification Checklist

1. Sign-in route redirects to provider.
2. Callback succeeds without configuration errors.
3. Session endpoint returns authenticated session after callback.
4. Missing/invalid env vars produce clear actionable errors.
5. Custom provider profile mapping returns a stable `sub`.
6. `trustedOrigins` blocks untrusted redirects/origins.
7. Provider IDs in config match built-in registry or valid custom definitions.

---

## Guardrails

- Do not invent provider IDs not present in code unless creating a custom provider.
- Do not commit real client secrets.
- Keep provider IDs lowercase.
- Preserve existing import style when already present (`@aura-stack/auth/oauth` vs `@aura-stack/auth/oauth/index`).
- Do not broaden `trustedOrigins` without explicit user intent.
- Preserve existing app conventions and folder structure.
