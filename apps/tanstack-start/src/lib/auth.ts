import { createAuth } from "@aura-stack/react/server"
import { createSecretValue } from "@aura-stack/react/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { handlers, jose, api } = createAuth({
    oauth,
    basePath: "/api/auth",
    trustedProxyHeaders: true,
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
