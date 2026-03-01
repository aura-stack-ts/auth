import { afterEach, describe, expect, test, vi } from "vitest"
import { env } from "@/env.ts"
import { generateSecure } from "@/secure.ts"

describe("env", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    test("read AURA_AUTH_SECRET from environment", () => {
        const secret = generateSecure()
        vi.stubEnv("AURA_AUTH_SECRET", secret!)
        expect(env.AURA_AUTH_SECRET).toBe(secret)
    })

    test("read multiple secrets from environment", () => {
        const secret1 = generateSecure()
        const secret2 = generateSecure()
        vi.stubEnv("AURA_AUTH_SECRET", `${secret1},${secret2}`)
        expect(env.AURA_AUTH_SECRET).toBe(`${secret1},${secret2}`)
    })

    test("nose", () => {
        const secret1 = generateSecure()
        const secret2 = generateSecure()
        vi.stubEnv("AURA_AUTH_SECRET", secret1)
        vi.stubEnv("AURA_AUTH_SECRET", secret2)
        expect(env.AURA_AUTH_SECRET).toBe(secret2)
    })
})
