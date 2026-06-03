import { createAuth } from "@/pages/createAuth"
import { createSecretValue } from "@aura-stack/react/crypto"

export const auth = createAuth({
    oauth: [],
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
