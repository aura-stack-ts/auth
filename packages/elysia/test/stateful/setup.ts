import "dotenv/config"
import { afterAll, beforeEach, vi } from "vitest"
import { prismaClient } from "@test/stateful/app"
import { afterEach } from "node:test"

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

afterEach(() => {
    vi.unstubAllGlobals()
})
