import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createJoseInstance } from "@/jose.ts"
import { createSecretValue } from "@/shared/crypto.ts"

const payload = {
    sub: "1234567890",
    name: "Alice",
    email: "alice@example.com",
    image: "alice.jpg",
}

beforeEach(() => {
    vi.stubEnv("SALT", createSecretValue())
    vi.stubEnv("SECRET", createSecretValue())
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("createJoseInstance", () => {
    test("createJoseInstance with default options", async () => {
        const jose = createJoseInstance()

        const signed = await jose.signJWS(payload)
        const verified = await jose.verifyJWS(signed)
        expect(verified).toMatchObject(payload)

        const encoded = await jose.encodeJWT(payload)
        const decoded = await jose.decodeJWT(encoded)
        expect(decoded).toMatchObject(payload)

        const encrypted = await jose.encryptJWE(payload)
        const decrypted = await jose.decryptJWE(encrypted)
        expect(decrypted).toMatchObject(payload)
    })

    test("set issuer, audience and signing algorithm", async () => {
        const secret = createSecretValue()
        const jose = createJoseInstance(secret, {
            jwt: {
                mode: "sealed",
                issuer: "test-issuer",
                audience: "test-audience",
                signingAlgorithm: "HS384",
            },
        })

        const signed = await jose.signJWS(payload)
        const verified = await jose.verifyJWS(signed)
        expect(verified).toMatchObject(payload)

        const encoded = await jose.encodeJWT(payload)
        const decoded = await jose.decodeJWT(encoded)
        expect(decoded).toMatchObject(payload)
    })

    test("overrides signing algorithm", async () => {
        const secret = createSecretValue()
        const jose = createJoseInstance(secret, {
            jwt: {
                mode: "signed",
                issuer: "test-issuer",
                audience: "test-audience",
                signingAlgorithm: "HS384",
            },
        })

        const signed = await jose.signJWS(payload, { alg: "HS256" })
        const verified = await jose.verifyJWS(signed, { algorithms: ["HS256"] })
        expect(verified).toMatchObject(payload)
        await expect(jose.verifyJWS(signed)).rejects.toThrow()
    })

    test("overrides issuer and audience", async () => {
        const secret = createSecretValue()
        const jose = createJoseInstance(secret, {
            jwt: {
                mode: "sealed",
                issuer: "test-issuer",
                audience: "test-audience",
                signingAlgorithm: "HS384",
                encryptionAlgorithm: "A256GCM",
                keyAlgorithm: "dir",
            },
        })

        const payloadWithCustomClaims = { ...payload, iss: "custom-issuer", aud: "custom-audience" }

        const signed = await jose.signJWS(payloadWithCustomClaims)
        await expect(jose.verifyJWS(signed)).rejects.toThrow()
        const verified = await jose.verifyJWS(signed, { issuer: "custom-issuer", audience: "custom-audience" })
        expect(verified).toMatchObject(payloadWithCustomClaims)

        const encrypted = await jose.encryptJWE(payloadWithCustomClaims)
        await expect(jose.decryptJWE(encrypted)).rejects.toThrow()
        const decrypted = await jose.decryptJWE(encrypted, { issuer: "custom-issuer", audience: "custom-audience" })
        expect(decrypted).toMatchObject(payloadWithCustomClaims)

        const encoded = await jose.encodeJWT(payloadWithCustomClaims)
        await expect(jose.decodeJWT(encoded)).rejects.toThrow()
        const decoded = await jose.decodeJWT(encoded, {
            verify: { issuer: "custom-issuer", audience: "custom-audience" },
        })
        expect(decoded).toMatchObject(payloadWithCustomClaims)
    })

    test("merge claims", async () => {
        const secret = createSecretValue()
        const jose = createJoseInstance(secret, {
            jwt: {
                audience: "test-audience",
            },
        })
        const signed = await jose.signJWS(payload, { alg: "HS512" })
        const verified = await jose.verifyJWS(signed, { algorithms: ["HS512"], audience: "test-audience" })
        expect(verified).toMatchObject({ ...payload, aud: "test-audience" })

        const encrypted = await jose.encryptJWE(payload, { alg: "dir", enc: "A256GCM" })
        const decrypted = await jose.decryptJWE(encrypted, { audience: "test-audience" })
        expect(decrypted).toMatchObject({ ...payload, aud: "test-audience" })

        const encoded = await jose.encodeJWT(payload, { sign: { alg: "HS512" }, encrypt: { alg: "dir", enc: "A128CBC-HS256" } })
        const decoded = await jose.decodeJWT(encoded, {
            verify: { algorithms: ["HS512"], audience: "test-audience" },
            decrypt: { keyManagementAlgorithms: ["dir"], contentEncryptionAlgorithms: ["A128CBC-HS256"] },
        })
        expect(decoded).toMatchObject({ ...payload, aud: "test-audience" })
    })

    test("invalid token", async () => {
        const jose = createJoseInstance()
        await expect(jose.verifyJWS("invalid-token")).rejects.toThrow()
        await expect(jose.decryptJWE("invalid-token")).rejects.toThrow()
        await expect(jose.decodeJWT("invalid-token")).rejects.toThrow()
    })
})
