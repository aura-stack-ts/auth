import { beforeEach, describe, expect, test, vi } from "vitest"
import { createJoseInstance, encoder } from "@/jose.ts"
import { createSecretValue, exportJWKKeyPair } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { generateKeyPair } from "@aura-stack/jose/jose"
import { RS256PEMFormat, RSAOAEP256PEMFormat } from "./presets.ts"

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

    test("rejects when a single CryptoKeyPair is reused with incompatible algs", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue())

        const secret = await generateKeyPair("RS256", { extractable: true })

        const jose = createJoseInstance(secret, {
            jwt: {
                mode: "sealed",
                signingAlgorithm: "RS256",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
            },
        })
        // Same RS256 key pair cannot satisfy RSA-OAEP-256 encryption
        await expect(jose.encodeJWT(payload)).rejects.toThrow()
    })

    test("invalid secret", () => {
        expect(() => createAuth({ oauth: [] })).toThrow(
            "Core security initialization failed because both 'AURA_AUTH_SECRET' and 'AUTH_SECRET' environment string keys are completely missing from runtime access contexts."
        )
    })

    test("invalid salt", () => {
        const secret = createSecretValue(32)
        expect(() => createAuth({ oauth: [], secret })).toThrow(
            "Core security initialization failed because both 'AURA_AUTH_SALT' and 'AUTH_SALT' environment string keys are completely missing from runtime access contexts."
        )
    })

    describe("Uint8Array", () => {
        const secret = new Uint8Array(32)

        test("JWS symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "HS256",
                },
            })
            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })

        test("JWE symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "dir",
                    encryptionAlgorithm: "A256GCM",
                },
            })
            expect(jose).toBeDefined()
            const encrypted = await jose.encryptJWE(payload)
            const decrypted = await jose.decryptJWE(encrypted)
            expect(decrypted).toMatchObject(payload)
        })

        test("JWE invalid asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256CBC-HS512",
                },
            })
            expect(jose).toBeDefined()
            await expect(jose.encryptJWE(payload)).rejects.toThrow(/JWE encryption failed/)
        })

        test("JWT signed and encrypted", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "sealed",
                    signingAlgorithm: "HS256",
                    keyAlgorithm: "dir",
                    encryptionAlgorithm: "A256GCM",
                },
            })
            expect(jose).toBeDefined()
            const token = await jose.encodeJWT(payload)
            const decoded = await jose.decodeJWT(token)
            expect(decoded).toMatchObject(payload)
        })

        test("JWT invalid signed and encrypted", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "sealed",
                    signingAlgorithm: "RS256",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256CBC-HS512",
                },
            })
            expect(jose).toBeDefined()
            await expect(jose.encodeJWT(payload)).rejects.toThrow()
        })
    })

    describe("crypto.getRandomValues", () => {
        const secret = createSecretValue(32)

        test("JWS symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "HS256",
                },
            })

            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })

        test("JWS invalid asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "RS256",
                },
            })
            expect(jose).toBeDefined()
            await expect(jose.signJWS(payload)).rejects.toThrow(/JWS signing failed/)
        })

        test("JWE symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "dir",
                    encryptionAlgorithm: "A256GCM",
                },
            })
            expect(jose).toBeDefined()
            const encrypted = await jose.encryptJWE(payload)
            const decrypted = await jose.decryptJWE(encrypted)
            expect(decrypted).toMatchObject(payload)
        })

        test("JWE invalid asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256CBC-HS512",
                },
            })
            expect(jose).toBeDefined()
            await expect(jose.encryptJWE(payload)).rejects.toThrow(/JWE encryption failed/)
        })

        test("JWT signed and encrypted", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "sealed",
                    signingAlgorithm: "HS256",
                    keyAlgorithm: "dir",
                    encryptionAlgorithm: "A256GCM",
                },
            })

            expect(jose).toBeDefined()
            const token = await jose.encodeJWT(payload)
            const decoded = await jose.decodeJWT(token)
            expect(decoded).toMatchObject(payload)
        })

        test("JWT invalid signed and encrypted", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "sealed",
                    signingAlgorithm: "RS256",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256CBC-HS512",
                },
            })
            expect(jose).toBeDefined()
            await expect(jose.encodeJWT(payload)).rejects.toThrow()
        })
    })

    describe("crypto.generateKey", async () => {
        test("JWS symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))
            const secret = await crypto.subtle.generateKey(
                {
                    name: "HMAC",
                    hash: "SHA-256",
                    length: 256,
                },
                true,
                ["sign", "verify"]
            )

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "HS256",
                },
            })
            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })

        test("JWE symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = await crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            )

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "dir",
                    encryptionAlgorithm: "A256GCM",
                },
            })
            expect(jose).toBeDefined()
            const encrypted = await jose.encryptJWE(payload)
            const decrypted = await jose.decryptJWE(encrypted)
            expect(decrypted).toMatchObject(payload)
        })

        test("JWS asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = await crypto.subtle.generateKey(
                {
                    name: "RSA-PSS",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["sign", "verify"]
            )
            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "PS256",
                },
            })
            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })
    })

    describe("crypto.importKey", async () => {
        test("JWS symmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secretKey = encoder.encode(createSecretValue(32))
            const secret = await crypto.subtle.importKey(
                "raw",
                secretKey,
                {
                    name: "HMAC",
                    hash: "SHA-256",
                },
                true,
                ["sign", "verify"]
            )

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "HS256",
                },
            })
            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })
    })

    describe("asymmetric key pair (RSA)", async () => {
        test("JWS asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = await generateKeyPair("RS256", {
                extractable: true,
            })

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "signed",
                    signingAlgorithm: "RS256",
                },
            })
            expect(jose).toBeDefined()
            const signed = await jose.signJWS(payload)
            const verified = await jose.verifyJWS(signed)
            expect(verified).toMatchObject(payload)
        })

        test("JWE asymmetric key", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = await generateKeyPair("RSA-OAEP-256", {
                extractable: true,
            })

            const jose = createJoseInstance(secret, {
                jwt: {
                    mode: "encrypted",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256GCM",
                },
            })
            expect(jose).toBeDefined()
            const encrypted = await jose.encryptJWE(payload)
            const decrypted = await jose.decryptJWE(encrypted)
            expect(decrypted).toMatchObject(payload)
        })

        test("JWT signed and encrypted", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const jwsEntries = await generateKeyPair("RS256", {
                extractable: true,
            })

            const jweEntries = await generateKeyPair("RSA-OAEP-256", {
                extractable: true,
            })

            const jose = createJoseInstance(
                {
                    sign: jwsEntries,
                    encrypt: jweEntries,
                },
                {
                    jwt: {
                        mode: "sealed",
                        signingAlgorithm: "RS256",
                        keyAlgorithm: "RSA-OAEP-256",
                        encryptionAlgorithm: "A256GCM",
                    },
                }
            )
            expect(jose).toBeDefined()
            const token = await jose.encodeJWT(payload)
            const decoded = await jose.decodeJWT(token)
            expect(decoded).toMatchObject(payload)
        })
    })

    test("PEM formatted RSA keys", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const { publicKey, privateKey } = RS256PEMFormat

        vi.stubEnv("AURA_AUTH_PUBLIC_KEY", publicKey)
        vi.stubEnv("AURA_AUTH_PRIVATE_KEY", privateKey)

        const jws = createJoseInstance(undefined, {
            jwt: {
                mode: "signed",
                signingAlgorithm: "RS256",
            },
        })
        const signed = await jws.signJWS(payload)
        const verified = await jws.verifyJWS(signed)
        expect(verified).toMatchObject(payload)

        const jwe = createJoseInstance(undefined, {
            jwt: {
                mode: "encrypted",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
            },
        })

        const encrypted = await jwe.encryptJWE(payload)
        const decrypted = await jwe.decryptJWE(encrypted)
        expect(decrypted).toMatchObject(payload)

        const jwt = createJoseInstance(undefined, {
            jwt: {
                mode: "sealed",
                signingAlgorithm: "RS256",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
            },
        })
        await expect(jwt.encodeJWT(payload)).rejects.toThrow(
            /A configuration layout rule conflict was detected. A single asymmetric key pair structure was loaded but the session processing mode was set to 'sealed'./
        )
    })

    test("PEM formatted RSA keys for sealed mode", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const { publicKey: jwsPublicKey, privateKey: jwsPrivateKey } = RS256PEMFormat
        const { publicKey: jwePublicKey, privateKey: jwePrivateKey } = RSAOAEP256PEMFormat

        vi.stubEnv("AURA_AUTH_SIGNING_PUBLIC_KEY", jwsPublicKey)
        vi.stubEnv("AURA_AUTH_SIGNING_PRIVATE_KEY", jwsPrivateKey)
        vi.stubEnv("AURA_AUTH_ENCRYPTION_PUBLIC_KEY", jwePublicKey)
        vi.stubEnv("AURA_AUTH_ENCRYPTION_PRIVATE_KEY", jwePrivateKey)

        const jwt = createJoseInstance(undefined, {
            jwt: {
                mode: "sealed",
                signingAlgorithm: "RS256",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
            },
        })

        const token = await jwt.encodeJWT(payload)
        const decoded = await jwt.decodeJWT(token)
        expect(decoded).toMatchObject(payload)

        const jws = createJoseInstance(undefined, {
            jwt: {
                mode: "signed",
                signingAlgorithm: "RS256",
            },
        })
        await expect(jws.signJWS(payload)).rejects.toThrow(
            /A configuration layout rule conflict was detected. Multiple asymmetric keys were passed but the runtime 'session.mode' parameter was not forced to 'sealed'./
        )
    })

    test("JWS (signed) with JWK formatted keys", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const secret = await exportJWKKeyPair("RS256", { extractable: true })
        const jose = createJoseInstance(secret, {
            jwt: {
                signingAlgorithm: "RS256",
            },
        })

        const signed = await jose.signJWS(payload)
        const verified = await jose.verifyJWS(signed)
        expect(verified).toMatchObject(payload)
    })

    test("JWE (encrypted) with JWK formatted keys", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const secret = await exportJWKKeyPair("RSA-OAEP-256", { extractable: true })
        const jose = createJoseInstance(secret, {
            jwt: {
                mode: "encrypted",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
            },
        })
        const encrypted = await jose.encryptJWE(payload)
        const decrypted = await jose.decryptJWE(encrypted)
        expect(decrypted).toMatchObject(payload)
    })

    test("JWT (sealed) with JWK formatted keys", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const signingKeyPair = await exportJWKKeyPair("RS256", { extractable: true })
        const encryptionKeyPair = await exportJWKKeyPair("RSA-OAEP-256", { extractable: true })
        const jose = createJoseInstance(
            {
                sign: signingKeyPair,
                encrypt: encryptionKeyPair,
            },
            {
                jwt: {
                    signingAlgorithm: "RS256",
                    keyAlgorithm: "RSA-OAEP-256",
                    encryptionAlgorithm: "A256GCM",
                },
            }
        )

        const encoded = await jose.encodeJWT(payload)
        const decoded = await jose.decodeJWT(encoded)
        expect(decoded).toMatchObject(payload)

        const signed = await jose.signJWS(payload)
        const verified = await jose.verifyJWS(signed)
        expect(verified).toMatchObject(payload)

        const encrypted = await jose.encryptJWE(payload)
        const decrypted = await jose.decryptJWE(encrypted)
        expect(decrypted).toMatchObject(payload)
    })
})
