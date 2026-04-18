import { createAuth } from "@aura-stack/react/server"
import { createSecretValue } from "@aura-stack/react/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { api, handlers } = createAuth({
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
                email: `${username.toLocaleLowerCase()}@example.com`,
            }
        },
    },
})
