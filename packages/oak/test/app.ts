import { Application, Router } from "@oak/oak"
import { createAuth } from "@/createAuth.ts"
import { createSecretValue } from "@aura-stack/auth/crypto"
import { zod } from "@aura-stack/auth/identity/zod"

const SECRET_KEY = createSecretValue(44)
const SALT_KEY = createSecretValue(44)

Deno.env.set("AURA_AUTH_SECRET", SECRET_KEY)
Deno.env.set("AURA_AUTH_SALT", SALT_KEY)

Deno.env.set("AURA_AUTH_GITHUB_CLIENT_ID", "github-client-id")
Deno.env.set("AURA_AUTH_GITHUB_CLIENT_SECRET", "github-client-secret")

export const { jose, withAuth, toHandler } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    credentials: {
        authorize: ({ credentials }) => {
            const { username, password } = credentials
            if (password === "invalid") {
                return null
            }
            const sub = `credentials:${username}`
            return {
                sub,
                name: username,
                email: `${username}@example.com`,
                image: `https://avatars.dicebear.com/api/identicon/${username}.svg`,
            }
        },
    },
    signUp: {
        schema: zod.object({
            firstName: zod.string(),
            lastName: zod.string(),
            email: zod.email(),
        }),
        onCreateUser: ({ payload }) => {
            const { firstName, lastName, email } = payload
            const sub = `credentials:${email}`
            return {
                sub,
                name: `${firstName} ${lastName}`,
                email,
                image: `https://avatars.dicebear.com/api/identicon/${firstName}${lastName}.svg`,
            }
        },
    },
})

const router = new Router()
const app = new Application()

router.get("/", (ctx) => {
    ctx.response.body = "Welcome to Aura Auth Oak App!"
})

router.all("/api/auth/(.*)", toHandler)

router.get("/api/protected", withAuth, (ctx) => {
    ctx.response.body = {
        message: "You have access to this protected resource.",
        session: ctx.state.session,
    }
})

app.use(router.routes())

export { app }
