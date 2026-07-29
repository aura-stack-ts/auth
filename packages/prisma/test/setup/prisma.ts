import "dotenv/config"
import { beforeEach } from "vitest"
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
        prismaClient.user.deleteMany(),
        prismaClient.account.deleteMany(),
        prismaClient.oAuthAccount.deleteMany(),
        prismaClient.credentialAccount.deleteMany(),
        prismaClient.device.deleteMany(),
        prismaClient.session.deleteMany(),
        prismaClient.mfaCredential.deleteMany(),
        prismaClient.oAuthTransaction.deleteMany(),
    ])
}

beforeEach(async () => {
    await resetDatabase()
})
