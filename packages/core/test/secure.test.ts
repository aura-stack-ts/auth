import { describe, test, expect } from "vitest"
import { createPKCE } from "@/secure.js"

describe("createPKCE", () => {
    test("generates a valid code verifier and code challenge", async () => {
        const { codeVerifier, codeChallenge, method } = await createPKCE()

        const expected = await createPKCE(codeVerifier)
        expect(expected.codeChallenge).toBe(codeChallenge)
        expect(expected.method).toBe(method)
    })
})
