import { zod } from "@aura-stack/auth/identity/zod"
import { createAuth } from "@aura-stack/react-router"
import { createSecretValue } from "@aura-stack/react-router/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react-router/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const {
    api,
    core: { handlers },
} = createAuth({
    oauth: ["github", "gitlab", "bitbucket"],
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
                email: `username@example.com`,
            }
        },
    },
    signUp: {
        schema: zod.object({
            username: zod.string().min(3).max(20),
            email: zod.email(),
            password: zod.string().min(6).max(20),
        }),
        onCreateUser: ({ payload }) => {
            const { username, email } = payload
            const sub = createSecretValue(10)
            /**
             * Here you can implement your logic to create a user in your database or any other storage.
             *
             * hashPassword(payload.password)
             */
            return {
                sub,
                name: username,
                email: email,
            }
        },
    },
})
