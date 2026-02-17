import { describe, test, expect } from "vitest"
import { createSecret } from "@/secret.js"
import { getRandomBytes } from "@/runtime.js"
import { createJWS, signJWS, verifyJWS } from "@/sign.js"
import { deriveKey, createDeriveKey } from "@/deriveKey.js"
import { createJWT, MIN_SECRET_ENTROPY_BITS } from "@/index.js"
import { createJWE, encryptJWE, decryptJWE } from "@/encrypt.js"
import type { JWTPayload } from "jose"

const payload: JWTPayload = {
    sub: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
}

describe("JWSs", () => {
    test("sign and verify a JWS using signJWS and verifyJWS", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const jws = await signJWS(payload, derivedKey)
        expect(jws).toBeDefined()

        const decodedPayload = await verifyJWS(jws, derivedKey)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("sign and verify a JWS using createJWS", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { signJWS, verifyJWS } = createJWS(derivedKey)

        const jws = await signJWS(payload)
        expect(jws).toBeDefined()

        const decodedPayload = await verifyJWS(jws)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("fail JWT to try to verify an invalid JWS", async () => {
        const { verifyJWS } = createJWS("my-secret-key")
        await expect(verifyJWS("invalid.jwt.token")).rejects.toThrow("Secret string must be at least 32 bytes long")
    })

    test("fail JWT to try to verify a JWS with invalid secret", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const jws = await signJWS(payload, derivedKey)
        expect(jws).toBeDefined()

        const { verifyJWS } = createJWS("wrong-secret-key")
        await expect(verifyJWS(jws)).rejects.toThrow("Secret string must be at least 32 bytes long")
    })

    test("fail JWT with invalid format JWS", async () => {
        const secretKey = getRandomBytes(32)
        const { signJWS } = createJWS(secretKey)
        await expect(signJWS(undefined as unknown as JWTPayload)).rejects.toThrow("The payload must be a non-empty object")
    })

    test("set audience in a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ aud: "client_id_123", name: "John Doe" }, secretKey)
        expect(await verifyJWS(jws, secretKey, { audience: "client_id_123" })).toMatchObject({ name: "John Doe" })
    })

    test("fail JWT to verify a JWS with incorrect audience", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ aud: "client_id_123", name: "John Doe" }, secretKey)
        await expect(verifyJWS(jws, secretKey, { audience: "wrong_audience" })).rejects.toThrow(
            "JWS signature verification failed"
        )
    })

    test("set expiration time in the payload of a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const now = Math.floor(Date.now() / 1000)
        const exp = now + 60
        const jws = await signJWS({ exp, name: "John Doe" }, secretKey)
        expect(await verifyJWS(jws, secretKey)).toMatchObject({ name: "John Doe", exp })
    })
})

describe("JWEs", () => {
    test("encrypt and decrypt a JWE using encryptJWE and decryptJWE", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const jwe = await encryptJWE(JSON.stringify(payload), derivedKey)
        expect(jwe).toBeDefined()

        const decryptedPayload = await decryptJWE(jwe, derivedKey)
        const decodedPayload = JSON.parse(decryptedPayload) as JWTPayload

        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("encrypt and decrypt a JWE using createJWE", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { signJWS } = createJWS(derivedKey)
        const { encryptJWE, decryptJWE } = createJWE(derivedKey)

        const jws = await signJWS(payload)
        const jwe = await encryptJWE(jws)
        expect(jwe).toBeDefined()

        const decryptedJWS = await decryptJWE(jwe)
        expect(decryptedJWS).toBe(jws)
    })

    test("fail JWT to try to decrypt an invalid JWE", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { decryptJWE } = createJWE(derivedKey)
        await expect(decryptJWE("header.payload.signature")).rejects.toThrow()
    })

    test("set audience in a JWE and decrypt it", async () => {
        const secretKey = getRandomBytes(32)
        const jwe = await encryptJWE(JSON.stringify({ aud: "client_id_123", name: "John Doe" }), secretKey)
        const decrypted = await decryptJWE(jwe, secretKey)
        const payload = JSON.parse(decrypted) as JWTPayload
        expect(payload).toMatchObject({ aud: "client_id_123", name: "John Doe" })
    })

    test("fail JWT to verify a JWE with incorrect audience", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ aud: "client_id_123", name: "John Doe" }, secretKey)
        const jwe = await encryptJWE(jws, secretKey)
        await expect(decryptJWE(jwe, secretKey, { audience: "wrong_audience" })).rejects.toThrow(
            "JWE decryption verification failed"
        )
    })
})

describe("JWTs", () => {
    test("create a signed and encrypted JWT using createJWS and createJWE functions", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { signJWS, verifyJWS } = createJWS(derivedKey)
        const { encryptJWE, decryptJWE } = createJWE(derivedKey)

        const jws = await signJWS(payload)
        const jwe = await encryptJWE(jws)
        expect(jwe).toBeDefined()

        const decryptedJWS = await decryptJWE(jwe)
        expect(decryptedJWS).toBe(jws)

        const decodedPayload = await verifyJWS(decryptedJWS)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("create a signed and encrypted JWT using createJWT function", async () => {
        const secret = getRandomBytes(32)
        const { encodeJWT, decodeJWT } = createJWT(secret)

        const jwt = await encodeJWT(payload)
        expect(jwt).toBeDefined()
        const decodedPayload = await decodeJWT(jwt)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("fail JWT to try to decode an invalid JWT", async () => {
        const secret = getRandomBytes(32)
        const { decodeJWT } = createJWT(secret)
        await expect(decodeJWT("invalid.jwt.token")).rejects.toThrow()
    })

    test("createJWT with invalid secret", async () => {
        const { encodeJWT } = createJWT("short")
        await expect(encodeJWT(payload)).rejects.toThrow("Secret string must be at least 32 bytes long")
    })

    test("create a signed and encrypted JWT using createJWT with separate JWS and JWE secrets", async () => {
        const secret = getRandomBytes(32)
        const derivedSigningKey = await createDeriveKey(secret, "salt", "signing")
        const derivedEncryptionKey = await createDeriveKey(secret, "salt", "encryption")

        const { encodeJWT, decodeJWT } = createJWT({ jws: derivedSigningKey, jwe: derivedEncryptionKey })

        const jwt = await encodeJWT(payload)
        expect(jwt).toBeDefined()
        const decodedPayload = await decodeJWT(jwt)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })
})

describe("createSecret", () => {
    test("createSecret without secret", () => {
        const secret = undefined
        expect(() => createSecret(secret as unknown as string)).toThrow("Secret is required")
    })

    test("createSecret with string secret with at least 32 bytes", () => {
        const secretString = "this-is-a-very-secure-and-long-secret"
        expect(() => createSecret(secretString)).toThrow(
            `Secret string must have an entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits per character`
        )
    })

    test("createSecret with string secret with less than 32 bytes", () => {
        const secretString = "short-secret"
        expect(() => createSecret(secretString)).toThrow("Secret string must be at least 32 bytes long")
    })

    test("createSecret returns the passed Uint8Array secret", () => {
        const secretArray = new Uint8Array(32)
        const secret = createSecret(secretArray)
        expect(secret).toBe(secretArray)
    })

    test("createSecret with null secret", () => {
        const secret = null
        expect(() => createSecret(secret as unknown as string)).toThrow("Secret is required")
    })

    test("createSecret with undefined secret", () => {
        const secret = undefined
        expect(() => createSecret(secret as unknown as string)).toThrow("Secret is required")
    })

    test("createSecret with repeated words", () => {
        const secret = "aaaabbbbccccddddeeeeffffgggghhhh"
        expect(() => createSecret(secret)).toThrow(
            `Secret string must have an entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits per character`
        )
    })

    test("createSecret with high entropy string", () => {
        const secret = "mysecretmysecretmysecretmysecret"
        expect(() => createSecret(secret)).toThrow(
            `Secret string must have an entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits per character`
        )
    })
})

describe("createDeriveKey", () => {
    test("createDeriveKey", async () => {
        await expect(createDeriveKey("asfts")).rejects.toThrow(/Secret string must be at least 32 bytes long/)
    })

    test("createDeriveKey with 32 bytes", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)
        expect(derivedKey).toBeDefined()
        expect(derivedKey.byteLength).toBe(32)
    })
})

describe("deriveKey", () => {
    test("deriveKey", async () => {
        const secret = "my-secret-password-123"
        const derivedKey1 = await deriveKey(Buffer.from(secret), "salt-1", "info-1")
        const derivedKey2 = await deriveKey(Buffer.from(secret), "salt-2", "info-2")
        expect(derivedKey1).toBeDefined()
        expect(derivedKey2).toBeDefined()
        expect(derivedKey1).not.toEqual(derivedKey2)
    })

    test("create deterministic derived keys", async () => {
        const salt = "deterministic-salt"
        const info = "deterministic-info"
        const secretKey = getRandomBytes(32)
        const derivedKey1 = await deriveKey(secretKey, salt, info)
        const derivedKey2 = await deriveKey(secretKey, salt, info)
        const derivedKey3 = await deriveKey(secretKey, salt, info)
        expect(derivedKey1).toEqual(derivedKey2)
        expect(derivedKey2).toEqual(derivedKey3)
    })
})
