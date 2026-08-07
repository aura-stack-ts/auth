import { createAuth } from "@aura-stack/tanstack-start"
import { createSecretValue } from "@aura-stack/tanstack-start/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/tanstack-start/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const {
    handlers,
    api,
    core: { jose },
} = createAuth({
    oauth: ["github", "google", "gitlab"],
    basePath: "/api/auth",
    credentials: {
        authorize: (ctx) => {
            const { username, password } = ctx.credentials
            if (!username || !password) return null
            const sub = createSecretValue(10)
            return {
                sub,
                name: username,
                email: `${username.toLowerCase()}@example.com`,
            }
        },
    },
})
