import { createAuth } from "@aura-stack/next/pages"
import { createSecretValue } from "@aura-stack/next/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/next/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { api, handlers, toHandler } = createAuth({
    oauth,
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
    logger: true,
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
