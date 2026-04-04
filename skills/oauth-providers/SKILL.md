---
name: oauth-providers
description: Set up OAuth providers in @aura-stack/auth, including built-in and custom providers, provider environment variables, trusted origins, and identity schema implications. Use this skill whenever users ask how to configure OAuth providers, add custom OAuth services, troubleshoot provider credentials, or understand identity schema behavior in Aura Auth.
license: MIT
---

# Setup OAuth Providers For Aura Auth

Use this skill to configure OAuth providers end-to-end for `@aura-stack/auth`.

## What this skill must cover

1. How to configure built-in providers in `createAuth`.
2. How to configure custom OAuth providers.
3. Environment variable requirements and naming patterns.
4. How to configure `trustedOrigins` safely.
5. What changes when `identity.schema` is configured.
6. Where to read official website docs for each topic.

## Mandatory docs-reading step

Before proposing changes, read the relevant docs pages (website content source or live docs):

- OAuth overview: `/docs/oauth`
- Custom providers guide: `/docs/guides/custom-providers`
- Config options (`oauth`, `trustedOrigins`, `identity`): `/docs/configuration/options`
- Environment variables: `/docs/configuration/env`
- API reference core: `/docs/api-reference/core`

If local docs source exists, use these files in this repository:

- `docs/src/content/docs/oauth/index.mdx`
- `docs/src/content/docs/guides/custom-providers.mdx`
- `docs/src/content/docs/configuration/options.mdx`
- `docs/src/content/docs/configuration/env.mdx`

## Inputs to collect first

Ask for missing details:

- Target framework/runtime.
- OAuth provider(s) to enable.
- Whether provider is built-in or custom.
- App callback/base URL.
- Existing auth file path.
- Whether user already has provider client credentials.

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
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"

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

Required secure values for auth runtime:

```env
AURA_AUTH_SECRET=""
AURA_AUTH_SALT=""
```

If credentials are missing, clearly state which env keys are required for each provider.

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

## Output format

Use this response structure:

```markdown
# Aura OAuth Provider Setup

## 1. Docs Checked

## 2. Provider Plan

## 3. Files To Create/Update

## 4. Environment Variables

## 5. trustedOrigins Configuration

## 6. identity.schema Impact

## 7. Verification Checklist
```

## Verification checklist

1. Sign-in route redirects to provider.
2. Callback succeeds without configuration errors.
3. Session endpoint returns authenticated session after callback.
4. Missing/invalid env vars produce clear actionable errors.
5. Custom provider profile mapping returns a stable `sub`.
6. `trustedOrigins` blocks untrusted redirects/origins.

## Guardrails

- Do not invent provider IDs not present in code unless creating a custom provider.
- Do not commit real client secrets.
- Keep provider IDs lowercase.
- Preserve existing app conventions and folder structure.
