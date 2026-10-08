import { describe, test, expect } from "vitest"
import { createPKCE } from "@/shared/crypto.ts"

describe("createPKCE", () => {
    test("generates a valid code verifier and code challenge", async () => {
        const { codeVerifier, codeChallenge, method } = await createPKCE()

        expect(codeVerifier.length).toBeGreaterThanOrEqual(43)
        expect(codeVerifier.length).toBeLessThanOrEqual(128)
        expect(method).toBe("S256")
        expect(codeChallenge).not.toBe(codeVerifier)

        const expected = await createPKCE(codeVerifier)
        expect(expected.codeChallenge).toBe(codeChallenge)
        expect(expected.method).toBe(method)
    })
})
