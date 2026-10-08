import { createAuth } from "@aura-stack/next/pages"
import { zod } from "@aura-stack/next/identity/zod"
import { createSecretValue } from "@aura-stack/next/crypto"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/next/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]
export const providers = [builtInOAuthProviders.github(), builtInOAuthProviders.gitlab(), builtInOAuthProviders.bitbucket()]

export const { api, toHandler } = createAuth({
    oauth: ["github", "gitlab", "bitbucket"],
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
                email: username,
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
