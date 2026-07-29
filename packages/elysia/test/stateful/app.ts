import "dotenv/config"
import { Elysia } from "elysia"
import { createAuth } from "@/createAuth"
import { zod } from "@aura-stack/auth/identity/zod"
import { PrismaPg } from "@prisma/adapter-pg"
import { prismaAdapter } from "@aura-stack/prisma"
import { PrismaClient } from "@/generated/prisma/client.ts"

const adapterPg = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

export const prismaClient = new PrismaClient({
    adapter: adapterPg,
})

export const adapter = prismaAdapter({
    client: prismaClient as any,
    deleteStrategy: "soft",
})

export const auth = createAuth({
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
        onCreateUser: async ({ payload }) => {
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
    session: {
        strategy: "database",
        adapter,
    },
})

export const app = new Elysia()

app.all("/api/auth/*", auth.toHandler)
