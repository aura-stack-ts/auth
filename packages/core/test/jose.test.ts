import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createJoseInstance } from "@/jose.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { generateKeyPair } from "@aura-stack/jose/jose"
import type { JWTEncryptionAlgorithm, JWTKeyAlgorithm, JWTSigningAlgorithm, SecretKey } from "@/@types/session.ts"

const payload = {
    sub: "1234567890",
    name: "Alice",
    email: "alice@example.com",
    image: "alice.jpg",
}

beforeEach(() => {
    /**
     * Skip environment variables because Aura Auth takes them as priority over
     * the options passed to createAuth, and we want to test the options directly
     * without interference from env vars.
     */
    vi.stubEnv("AURA_AUTH_SALT", undefined)
    vi.stubEnv("AURA_AUTH_SECRET", undefined)
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

const testJWSAlgorithms = (secret: SecretKey) => {
    describe("JWS algorithms", () => {
        const testCases: JWTSigningAlgorithm[] = [
            "HS256",
            "HS384",
            "HS512",
            "RS256",
            "RS384",
            "RS512",
            "ES256",
            "ES384",
            "ES512",
            "EdDSA",
            "PS256",
        ]
        for (const alg of testCases) {
            test(`algorithm: ${alg}`, async () => {
                vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

                expect(
                    createAuth({
                        oauth: [],
                        secret,
                        session: {
                            jwt: {
                                mode: "signed",
                                signingAlgorithm: alg,
                            },
                        },
                    })
                ).toBeDefined()
            })
        }
    })
}

const testJWEAlgorithms = (secret: SecretKey) => {
    describe("JWE algorithms", () => {
        const testCases: JWTEncryptionAlgorithm[] = [
            "A128CBC-HS256",
            "A192CBC-HS384",
            "A256CBC-HS512",
            "A128GCM",
            "A192GCM",
            "A256GCM",
        ]
        const keyAlgs: JWTKeyAlgorithm[] = [
            "A128KW",
            "A192KW",
            "A256KW",
            "dir",
            "ECDH-ES",
            "ECDH-ES+A128KW",
            "ECDH-ES+A256KW",
            "RSA-OAEP",
            "RSA-OAEP-256",
        ]
        for (const alg of testCases) {
            for (const keyAlg of keyAlgs) {
                test(`enc: ${alg}, key: ${keyAlg}`, async () => {
                    vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

                    expect(
                        createAuth({
                            oauth: [],
                            secret,
                            session: {
                                jwt: {
                                    mode: "encrypted",
                                    encryptionAlgorithm: alg,
                                    keyAlgorithm: keyAlg,
                                },
                            },
                        })
                    ).toBeDefined()
                })
            }
        }
    })
}

const testJWTAlgorithms = (secret: SecretKey) => {
    describe("JWE algorithms", () => {
        const jwsAlgorithms: JWTSigningAlgorithm[] = [
            "HS256",
            "HS384",
            "HS512",
            "RS256",
            "RS384",
            "RS512",
            "ES256",
            "ES384",
            "ES512",
            "EdDSA",
            "PS256",
        ]

        const jweAlgorithms: JWTEncryptionAlgorithm[] = [
            "A128CBC-HS256",
            "A192CBC-HS384",
            "A256CBC-HS512",
            "A128GCM",
            "A192GCM",
            "A256GCM",
        ]
        for (const jwsAlg of jwsAlgorithms) {
            for (const jweAlg of jweAlgorithms) {
                test(`sig: ${jwsAlg}, enc: ${jweAlg}, key: dir`, async () => {
                    vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

                    expect(
                        createAuth({
                            oauth: [],
                            secret,
                            session: {
                                jwt: {
                                    mode: "sealed",
                                    signingAlgorithm: jwsAlg,
                                    encryptionAlgorithm: jweAlg,
                                    keyAlgorithm: "dir",
                                },
                            },
                        })
                    ).toBeDefined()
                })
            }
        }
    })
}

describe("createJoseInstance", () => {
    test("createJoseInstance with default options", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

        const secret = createSecretValue()
        const jose = createJoseInstance(secret)

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
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

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
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

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
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

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
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

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
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

        const secret = createSecretValue()
        const jose = createJoseInstance(secret)
        await expect(jose.verifyJWS("invalid-token")).rejects.toThrow()
        await expect(jose.decryptJWE("invalid-token")).rejects.toThrow()
        await expect(jose.decodeJWT("invalid-token")).rejects.toThrow()
    })
})

describe("secrets", () => {
    test("invalid secret", () => {
        expect(() => createAuth({ oauth: [] })).toThrow(
            "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
        )
    })

    test("invalid salt", () => {
        const secret = createSecretValue(32)
        expect(() => createAuth({ oauth: [], secret })).toThrow(
            "AURA_AUTH_SALT or AUTH_SALT environment variable is not set. A salt value is required for key derivation."
        )
    })

    describe("crypto.getRandomValues", () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const secret = createSecretValue(32)
        testJWSAlgorithms(secret)
        testJWEAlgorithms(secret)
        testJWTAlgorithms(secret)
    })

    describe("crypto.generateKey", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const secret = await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        )
        testJWSAlgorithms(secret)
        testJWEAlgorithms(secret)
        testJWTAlgorithms(secret)
    })

    describe("crypto.importKey", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const rawKey = new Uint8Array(32)
        const secret = await crypto.subtle.importKey(
            "raw",
            rawKey,
            {
                name: "AES-GCM",
            },
            true,
            ["encrypt", "decrypt"]
        )

        testJWSAlgorithms(secret)
        testJWEAlgorithms(secret)
        testJWTAlgorithms(secret)
    })

    describe("uint8array secret", () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const secret = new Uint8Array(32)
        testJWSAlgorithms(secret)
        testJWEAlgorithms(secret)
        testJWTAlgorithms(secret)
    })

    describe("symmetric key", async () => {
        const entries = await generateKeyPair("RS256")
        testJWSAlgorithms(entries)
        testJWEAlgorithms(entries)
        testJWTAlgorithms(entries)
    })
})
