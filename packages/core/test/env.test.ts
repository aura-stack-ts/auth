import { afterEach, describe, expect, test, vi } from "vitest"
import { env } from "@/shared/env.ts"
import { createSecretValue } from "@/shared/crypto.ts"

describe("env", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    test("read AURA_AUTH_SECRET from environment", () => {
        const secret = createSecretValue()
        vi.stubEnv("AURA_AUTH_SECRET", secret!)
        expect(env.AURA_AUTH_SECRET).toBe(secret)
    })

    test("read multiple secrets from environment", () => {
        const secret1 = createSecretValue()
        const secret2 = createSecretValue()
        vi.stubEnv("AURA_AUTH_SECRET", `${secret1},${secret2}`)
        expect(env.AURA_AUTH_SECRET).toBe(`${secret1},${secret2}`)
    })

    test("last stubbed value overwrites previous values", () => {
        const secret1 = createSecretValue()
        const secret2 = createSecretValue()
        vi.stubEnv("AURA_AUTH_SECRET", secret1)
        vi.stubEnv("AURA_AUTH_SECRET", secret2)
        expect(env.AURA_AUTH_SECRET).toBe(secret2)
    })
})
