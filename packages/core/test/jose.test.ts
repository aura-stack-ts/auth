import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createJoseInstance, encoder } from "@/jose.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { generateKeyPair } from "@aura-stack/jose/jose"

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
            "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
        )
    })

    test("invalid salt", () => {
        const secret = createSecretValue(32)
        expect(() => createAuth({ oauth: [], secret })).toThrow(
            "AURA_AUTH_SALT or AUTH_SALT environment variable is not set. A salt value is required for key derivation."
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

        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv5eSIl71g3dyLEFYbv3B
i93M9nCBLWkbI8mOQLmGgXEj3k92rwfF/+B5gCr1OMUmV+aSLsDvdhDiljQAUpQO
3ziLaYlk0k8paw7fZjkIejz5BwiWFODTqg9HWSOGr5hfJzyL9gvzaAI2Sp7htei/
En0u79eRNQNII0dmQtwiMpIEQbisadUEp5+s0Dd7yGUoR18V7pv2A/Ohii8lMUUL
Efs71Ypf0L5rO9SAhjztxhR6wGWYe+uCNDEF0wuQ/ZL9TvI46Zpf+Z1z+0CzpXYr
Eloe8oqcCuPIJ1GszZst+qkgFdyo0BXGa1nuA/21ZLmAwUXdzmF1nsGg0J/sUcEQ
TwIDAQAB
-----END PUBLIC KEY-----`
        const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/l5IiXvWDd3Is
QVhu/cGL3cz2cIEtaRsjyY5AuYaBcSPeT3avB8X/4HmAKvU4xSZX5pIuwO92EOKW
NABSlA7fOItpiWTSTylrDt9mOQh6PPkHCJYU4NOqD0dZI4avmF8nPIv2C/NoAjZK
nuG16L8SfS7v15E1A0gjR2ZC3CIykgRBuKxp1QSnn6zQN3vIZShHXxXum/YD86GK
LyUxRQsR+zvVil/Qvms71ICGPO3GFHrAZZh764I0MQXTC5D9kv1O8jjpml/5nXP7
QLOldisSWh7yipwK48gnUazNmy36qSAV3KjQFcZrWe4D/bVkuYDBRd3OYXWewaDQ
n+xRwRBPAgMBAAECggEACh2r77IMck7cUbDexSsTZo0LlUsWzvmya9ib10s60MFs
1hnJyu91CVyy6maaQJwyn5TpgAJCdbBQWANSRwnq1RqZTDVSBCnkDNm7eukk/otG
NmEolENteZh8uTY/SZMygJHzIK0iqQm0D/GR0+oZ+JU9seUzlTuuOeQ7TOluY5wR
i/V6ldrDSOxd2xIKUnxemw0qwbUz0oZ5CKo22K+VksGwa/PempkpyZloSGsE+QR5
5cZwWxGelzUCDyflOImX+TCKI4IsuBOI+CaQohY3j3xSEunSyE4BCITgtIjlHJOB
OspOYs/rYQt9xe1ZzBlRTbq/iZAonMgRS1ELm75eWQKBgQD2dlyaZIMpuhKWBWgb
tPC0CrPLxOqWi5TSkaR+kk389xOqi6m62mPph5dCxv/TrvrXD+v/uST2aAYPnLSY
3ieVF+KN5fc64M2rgUYR9kOE0ubiir1RI7L7yhYo/bmtSnpd1Wr6vJBU6zEBayTL
X4Uw+nABrO/Si5SEssb9LGF/RwKBgQDHAZ+iiOhzOJCp9kCqHYJ5ageNVT/Fc85W
40pYSAiuPlolJV43oG0EnFI7MVkvqSExHfNtk7PgQsahPTsWThJRL4stzbBINmDW
Fxl505BOoXhnJHLqnQgzmNTinnupumnENImm5ChWbujRREi6kIiZYqUlKjQjN1j1
9TTGCto6uQKBgQCb6NA30vGuSclMIetz64iBPGv0sYL87RueAQggEYlIRzynnGYo
j9K4fk/PrHdVf9GqjqXqRUL+pVuAMM+GDLLZfByTSzCUjHVO0x5yamjX81qfYMjW
NVEaOwK9t5Pn7b9u8H0WVIaxUX7UuOSzyp9FFogYZz/m3ul68GU07whWLQKBgEhP
Mbb4MiYzpnTrUmG9qTv+p9HV6P8Q7ieqHMhpHCZb55tZsZtawmILfuGdM7/an4He
VSY6pgBVoyDRQ9f99C/lq5ewBl6my5be+9XFZsj7aOlpWAwhlOpSnP/fACYS4v10
7ZNjkbieQiBPxHFttQSu0Dzp0dn98WgledB//v2ZAoGAFdsS7VxBMCBcJIgPoYiX
GDUYZsTiISPnSRqRk1hXkRt1woAa8CK3zsCyrruoCj3VJFk6gb+TWuyBXv4kfRkv
TGcJZ3AYFKmelXl+1+rRXhe+f79+Z8kRdRSonuG/l1PdtG3P1uglzvksQcSMfOfA
41a79/alPIgWSGQhEbPxR8I=
-----END PRIVATE KEY-----`

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
                importedAlgorithm: "RSA-OAEP-256",
            },
        })

        const encrypted = await jwe.encryptJWE(payload)
        const decrypted = await jwe.decryptJWE(encrypted)
        expect(decrypted).toMatchObject(payload)
    })

    test("PEM formatted RSA keys to encode and decode JWT", async () => {
        vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv5eSIl71g3dyLEFYbv3B
i93M9nCBLWkbI8mOQLmGgXEj3k92rwfF/+B5gCr1OMUmV+aSLsDvdhDiljQAUpQO
3ziLaYlk0k8paw7fZjkIejz5BwiWFODTqg9HWSOGr5hfJzyL9gvzaAI2Sp7htei/
En0u79eRNQNII0dmQtwiMpIEQbisadUEp5+s0Dd7yGUoR18V7pv2A/Ohii8lMUUL
Efs71Ypf0L5rO9SAhjztxhR6wGWYe+uCNDEF0wuQ/ZL9TvI46Zpf+Z1z+0CzpXYr
Eloe8oqcCuPIJ1GszZst+qkgFdyo0BXGa1nuA/21ZLmAwUXdzmF1nsGg0J/sUcEQ
TwIDAQAB
-----END PUBLIC KEY-----`
        const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/l5IiXvWDd3Is
QVhu/cGL3cz2cIEtaRsjyY5AuYaBcSPeT3avB8X/4HmAKvU4xSZX5pIuwO92EOKW
NABSlA7fOItpiWTSTylrDt9mOQh6PPkHCJYU4NOqD0dZI4avmF8nPIv2C/NoAjZK
nuG16L8SfS7v15E1A0gjR2ZC3CIykgRBuKxp1QSnn6zQN3vIZShHXxXum/YD86GK
LyUxRQsR+zvVil/Qvms71ICGPO3GFHrAZZh764I0MQXTC5D9kv1O8jjpml/5nXP7
QLOldisSWh7yipwK48gnUazNmy36qSAV3KjQFcZrWe4D/bVkuYDBRd3OYXWewaDQ
n+xRwRBPAgMBAAECggEACh2r77IMck7cUbDexSsTZo0LlUsWzvmya9ib10s60MFs
1hnJyu91CVyy6maaQJwyn5TpgAJCdbBQWANSRwnq1RqZTDVSBCnkDNm7eukk/otG
NmEolENteZh8uTY/SZMygJHzIK0iqQm0D/GR0+oZ+JU9seUzlTuuOeQ7TOluY5wR
i/V6ldrDSOxd2xIKUnxemw0qwbUz0oZ5CKo22K+VksGwa/PempkpyZloSGsE+QR5
5cZwWxGelzUCDyflOImX+TCKI4IsuBOI+CaQohY3j3xSEunSyE4BCITgtIjlHJOB
OspOYs/rYQt9xe1ZzBlRTbq/iZAonMgRS1ELm75eWQKBgQD2dlyaZIMpuhKWBWgb
tPC0CrPLxOqWi5TSkaR+kk389xOqi6m62mPph5dCxv/TrvrXD+v/uST2aAYPnLSY
3ieVF+KN5fc64M2rgUYR9kOE0ubiir1RI7L7yhYo/bmtSnpd1Wr6vJBU6zEBayTL
X4Uw+nABrO/Si5SEssb9LGF/RwKBgQDHAZ+iiOhzOJCp9kCqHYJ5ageNVT/Fc85W
40pYSAiuPlolJV43oG0EnFI7MVkvqSExHfNtk7PgQsahPTsWThJRL4stzbBINmDW
Fxl505BOoXhnJHLqnQgzmNTinnupumnENImm5ChWbujRREi6kIiZYqUlKjQjN1j1
9TTGCto6uQKBgQCb6NA30vGuSclMIetz64iBPGv0sYL87RueAQggEYlIRzynnGYo
j9K4fk/PrHdVf9GqjqXqRUL+pVuAMM+GDLLZfByTSzCUjHVO0x5yamjX81qfYMjW
NVEaOwK9t5Pn7b9u8H0WVIaxUX7UuOSzyp9FFogYZz/m3ul68GU07whWLQKBgEhP
Mbb4MiYzpnTrUmG9qTv+p9HV6P8Q7ieqHMhpHCZb55tZsZtawmILfuGdM7/an4He
VSY6pgBVoyDRQ9f99C/lq5ewBl6my5be+9XFZsj7aOlpWAwhlOpSnP/fACYS4v10
7ZNjkbieQiBPxHFttQSu0Dzp0dn98WgledB//v2ZAoGAFdsS7VxBMCBcJIgPoYiX
GDUYZsTiISPnSRqRk1hXkRt1woAa8CK3zsCyrruoCj3VJFk6gb+TWuyBXv4kfRkv
TGcJZ3AYFKmelXl+1+rRXhe+f79+Z8kRdRSonuG/l1PdtG3P1uglzvksQcSMfOfA
41a79/alPIgWSGQhEbPxR8I=
-----END PRIVATE KEY-----`

        vi.stubEnv("AURA_AUTH_PUBLIC_KEY", publicKey)
        vi.stubEnv("AURA_AUTH_PRIVATE_KEY", privateKey)

        const jwt = createJoseInstance(undefined, {
            jwt: {
                mode: "sealed",
                signingAlgorithm: "RS256",
                keyAlgorithm: "RSA-OAEP-256",
                encryptionAlgorithm: "A256GCM",
                importedAlgorithm: "RSA-OAEP-256",
            },
        })

        await expect(jwt.encodeJWT(payload)).rejects.toThrow(/JWS signing failed/)
        //const token = await jwt.encodeJWT(payload)
        //const decoded = await jwt.decodeJWT(token)
        //expect(decoded).toMatchObject(payload)
    })
})
