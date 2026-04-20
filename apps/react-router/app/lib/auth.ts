import { createAuth } from "@aura-stack/react-router"
import { createSecretValue } from "@aura-stack/react-router/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react-router/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const {
    api,
    core: { handlers },
} = createAuth({
    oauth,
    basePath: "/api/auth",
    baseURL: "http://localhost:5174",
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
