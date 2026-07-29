import "dotenv/config"
import { afterAll, beforeEach } from "vitest"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client.ts"
import { prismaAdapter } from "@/index.ts"

const pgAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prismaClient = new PrismaClient({ adapter: pgAdapter })

export const adapter = prismaAdapter({
    client: prismaClient,
    deleteStrategy: "soft",
})

export const resetDatabase = async () => {
    await prismaClient.$transaction([
        prismaClient.account.deleteMany(),
        prismaClient.oAuthAccount.deleteMany(),
        prismaClient.credentialAccount.deleteMany(),
        prismaClient.device.deleteMany(),
        prismaClient.mfaCredential.deleteMany(),
        prismaClient.oAuthTransaction.deleteMany(),
        prismaClient.session.deleteMany(),
        prismaClient.user.deleteMany(),
    ])
}

beforeEach(async () => {
    await resetDatabase()
})

afterAll(async () => {
    await prismaClient.$disconnect()
})
