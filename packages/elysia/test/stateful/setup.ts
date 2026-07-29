import "dotenv/config"
import { afterAll, beforeEach } from "vitest"
import { prismaClient } from "@test/stateful/app"

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

afterAll(async () => {
    await prismaClient.$disconnect()
})
