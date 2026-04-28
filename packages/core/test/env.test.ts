import { afterEach, describe, expect, test, vi } from "vitest"
import { env } from "@/shared/env.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import { exportPKCS8, exportSPKI, generateKeyPair } from "@aura-stack/jose/jose"

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

    test("direct PEM formatted RSA keys", async () => {
        const pem = `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtGbid5pLu9wsGut7Fg26
    SPBGntzZk6i17MIf2eS++01/7uq0a59yxYa1AvPbO9OdQDngRup7zPUc7dKivwQe
    hHTPQ86H9EJkgKqupKj8PUbfzSFzpwcTs9RZmd9o9jBXOkbtH18Pn+jNbqxB0AFA
    C4ZYfU+l2981U4Xb5UAOfJaqbEWlG0AvW8dqkU1TtAoXtGpoINv46qHF1gSYRDsU
    AafJaMzLOOC0EhP3U/XZNuAFqgOosGx5iJ1+fyFwMjH+w5iSAXvk1C7KyPTYJDMV
    JyuDj7yG/TR5yDPS7fyFsbdrLQlwCPqUCmg8Y9lQltXYWu8PptxJYZV4RBbBJ8fr
    PQIDAQAB
    -----END PUBLIC KEY-----`
        vi.stubEnv("AURA_AUTH_SECRET", pem)
        expect(env.AURA_AUTH_SECRET).toBe(pem)
    })

    test("PEM formatted RSA keys with newlines", async () => {
        const keyPair = await generateKeyPair("RS256", { extractable: true })
        const publicKeyPEM = await exportSPKI(keyPair.publicKey)
        const privateKeyPEM = await exportPKCS8(keyPair.privateKey)
        vi.stubEnv("AURA_AUTH_SECRET", `${publicKeyPEM}\n${privateKeyPEM}`)
        expect(env.AURA_AUTH_SECRET).toBe(`${publicKeyPEM}\n${privateKeyPEM}`)
    })
})
