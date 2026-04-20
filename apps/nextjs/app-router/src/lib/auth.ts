import { createAuth } from "@aura-stack/next"
import { createSecretValue } from "@aura-stack/next/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/next/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]
export const providers = [builtInOAuthProviders.github(), builtInOAuthProviders.gitlab(), builtInOAuthProviders.bitbucket()]

export const { api, core } = createAuth({
    oauth,
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
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
