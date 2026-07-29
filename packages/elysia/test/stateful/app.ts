import "dotenv/config"
import { Elysia } from "elysia"
import { createAuth } from "@/createAuth"
import { zod } from "@aura-stack/auth/identity/zod"
import { PrismaPg } from "@prisma/adapter-pg"
import { prismaAdapter } from "@aura-stack/prisma"
import { PrismaClient } from "@/generated/prisma/client.ts"
import { createSecretValue } from "@aura-stack/auth/crypto"

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

export const prismaClient = new PrismaClient({
    adapter,
})

export const auth = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    credentials: {
        authorize: ({ credentials }) => {
            const sub = createSecretValue(16)
            const { username, password } = credentials
            if (password === "invalid") {
                return null
            }
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
        onCreateUser: async ({ payload }) => {
            const sub = createSecretValue(16)
            const { firstName, lastName, email } = payload
            return {
                sub,
                name: `${firstName} ${lastName}`,
                email,
                image: `https://avatars.dicebear.com/api/identicon/${firstName}${lastName}.svg`,
            }
        },
    },
    session: {
        strategy: "database",
        adapter: prismaAdapter({
            /**
             * @todo fix types
             */
            client: prismaClient as any,
            deleteStrategy: "soft",
        }),
    },
})

export const app = new Elysia()

app.all("/api/auth/*", auth.toHandler)

app.derive(auth.withAuth).get("/api/protected", ({ session }) => {
    if (!session) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        })
    }
    return {
        message: "You have access to this protected resource.",
        session,
    }
})
