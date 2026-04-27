import { describe, test, expect } from "vitest"
import { createSecret } from "@/secret.ts"
import { encoder, getRandomBytes } from "@/crypto.ts"
import { createJWS, signJWS, verifyJWS } from "@/sign.ts"
import { deriveKey, createDeriveKey } from "@/deriveKey.ts"
import { createCompactJWE, createJWE, decryptCompactJWE, decryptJWE, encryptJWE, compactEncryptJWE } from "@/encrypt.ts"
import { createJWT, decodeJWT, encodeJWT, MIN_SECRET_ENTROPY_BITS, type SecretInput } from "@/index.ts"
import { generateKeyPair, type JWTPayload } from "jose"

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

    test("set not before time in the payload of a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const now = Math.floor(Date.now() / 1000)
        const nbf = now + 60
        const jws = await signJWS({ nbf, name: "John Doe" }, secretKey)
        await expect(verifyJWS(jws, secretKey)).rejects.toThrow("JWS signature verification failed")
    })

    test("set issued at time in the payload of a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const iat = Math.floor(Date.now() / 1000)
        const jws = await signJWS({ iat, name: "John Doe" }, secretKey)
        expect(await verifyJWS(jws, secretKey)).toMatchObject({ name: "John Doe", iat })
    })

    test("set JWT ID in the payload of a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const jti = "unique-jwt-id-123"
        const jws = await signJWS({ jti, name: "John Doe" }, secretKey)
        expect(await verifyJWS(jws, secretKey)).toMatchObject({ name: "John Doe", jti })
    })

    test("set protected header parameters in a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ name: "John Doe" }, secretKey, { alg: "HS256", typ: "JWT" })
        expect(await verifyJWS(jws, secretKey)).toMatchObject({ name: "John Doe" })
    })

    test("fail JWT to sign a JWS with invalid protected header parameters", async () => {
        const secretKey = getRandomBytes(32)
        await expect(signJWS({ name: "John Doe" }, secretKey, { alg: "invalid-algorithm" })).rejects.toThrow("JWS signing failed")
    })

    test("set none algorithm in the protected header of a JWS and fail to verify it", async () => {
        const secretKey = getRandomBytes(32)
        await expect(signJWS({ name: "John Doe" }, secretKey, { alg: "none" })).rejects.toThrow("JWS signing failed")
    })

    test("set custom protected header parameters in a JWS and verify it", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ name: "John Doe" }, secretKey, { alg: "HS256", typ: "JWT", kid: "key-id-123" })
        expect(await verifyJWS(jws, secretKey)).toMatchObject({ name: "John Doe" })
    })

    test("verify JWT with audience claim", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ name: "John Doe", aud: "https://example.com" }, secretKey)
        expect(await verifyJWS(jws, secretKey, { audience: "https://example.com" })).toMatchObject({
            name: "John Doe",
            aud: "https://example.com",
        })
    })

    test("fail JWT to verify a JWS with incorrect audience claim", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ name: "John Doe", aud: "https://example.com" }, secretKey)
        await expect(verifyJWS(jws, secretKey, { audience: "https://wrong-audience.com" })).rejects.toThrow(
            "JWS signature verification failed"
        )
    })

    test("verify JWT with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RS256")
        const jws = await signJWS(payload, privateKey, { alg: "RS256" })
        const decodedPayload = await verifyJWS(jws, publicKey, { algorithms: ["RS256"] })
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("fail JWT to verify a JWS with incorrect RSA public key", async () => {
        const { privateKey } = await generateKeyPair("RS256")
        const { publicKey: wrongPublicKey } = await generateKeyPair("RS256")
        const jws = await signJWS(payload, privateKey, { alg: "RS256" })
        await expect(verifyJWS(jws, wrongPublicKey, { algorithms: ["RS256"] })).rejects.toThrow(
            "JWS signature verification failed"
        )
    })

    test("verify createJWS with crypto.generateKey", async () => {
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
        const { signJWS, verifyJWS } = createJWS(secret)
        const signed = await signJWS(payload, { alg: "PS256" })
        const verified = await verifyJWS(signed, { algorithms: ["PS256"] })
        expect(verified).toMatchObject(payload)
    })

    test("verify createJWS with crypto.importKey", async () => {
        const secretValue = encoder.encode(getRandomBytes(32).toString())
        const secret = await crypto.subtle.importKey(
            "raw",
            secretValue,
            {
                name: "HMAC",
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        )
        const { signJWS, verifyJWS } = createJWS(secret)
        const signed = await signJWS(payload, { alg: "HS256" })
        const verified = await verifyJWS(signed, { algorithms: ["HS256"] })
        expect(verified).toMatchObject(payload)
    })

    test("verify createJWS with RSA algorithm", async () => {
        const entries = await generateKeyPair("RS256")
        const { signJWS, verifyJWS } = createJWS(entries)
        const jws = await signJWS(payload, { alg: "RS256" })
        const decoded = await verifyJWS(jws, { algorithms: ["RS256"] })
        expect(decoded.sub).toBe(payload.sub)
        expect(decoded.name).toBe(payload.name)
        expect(decoded.email).toBe(payload.email)
    })
})

describe("JWEs", () => {
    test("encrypt and decrypt a JWE using encryptJWE and decryptJWE", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const jwe = await encryptJWE({ payload }, derivedKey)
        expect(jwe).toBeDefined()

        const decryptedPayload = await decryptJWE<{ payload: string }>(jwe, derivedKey)
        expect(decryptedPayload.payload).toMatchObject(payload)
    })

    test("encrypt and decrypt a JWE using createJWE", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { signJWS } = createJWS(derivedKey)
        const { encryptJWE, decryptJWE } = createJWE(derivedKey)

        const jws = await signJWS(payload)
        const jwe = await encryptJWE({ payload: jws })
        expect(jwe).toBeDefined()

        const decryptedJWS = await decryptJWE<{ payload: string }>(jwe)
        expect(decryptedJWS.payload).toBe(jws)
    })

    test("fail JWT to try to decrypt an invalid JWE", async () => {
        const secretKey = getRandomBytes(32)
        await expect(decryptJWE("header.payload.signature", secretKey)).rejects.toThrow(/JWE decryption verification failed/)
    })

    test("set audience in a JWE and decrypt it", async () => {
        const secretKey = getRandomBytes(32)
        const jwe = await encryptJWE({ aud: "client_id_123", name: "John Doe" }, secretKey)
        const decrypted = await decryptJWE(jwe, secretKey)
        expect(decrypted).toMatchObject({ aud: "client_id_123", name: "John Doe" })
    })

    test("fail JWT to verify a JWE with incorrect audience", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS({ aud: "client_id_123", name: "John Doe" }, secretKey)
        const jwe = await encryptJWE({ payload: jws }, secretKey)
        await expect(decryptJWE(jwe, secretKey, { audience: "wrong_audience" })).rejects.toThrow(
            "JWE decryption verification failed"
        )
    })

    test("encrypt and decrypt compact JWE payload", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS(payload, secretKey)

        const compactJWE = await compactEncryptJWE(jws, secretKey)
        expect(compactJWE).toBeDefined()

        const decryptedJWS = await decryptCompactJWE(compactJWE, secretKey)
        expect(decryptedJWS).toBe(jws)
    })

    test("encrypt and decrypt compact JWE payload using createCompactJWE", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS(payload, secretKey)
        const { compactEncryptJWE, decryptCompactJWE } = createCompactJWE(secretKey)

        const compactJWE = await compactEncryptJWE(jws)
        const decryptedJWS = await decryptCompactJWE(compactJWE)
        expect(decryptedJWS).toBe(jws)
    })

    test("verify JWE with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const jwe = await encryptJWE({ payload }, publicKey, { alg: "RSA-OAEP-256", enc: "A256GCM" })
        const decryptedPayload = await decryptJWE<{ payload: string }>(jwe, privateKey, {
            keyManagementAlgorithms: ["RSA-OAEP-256"],
            contentEncryptionAlgorithms: ["A256GCM"],
        })
        expect(decryptedPayload.payload).toMatchObject(payload)
    })

    test("verify createJWE with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const { encryptJWE, decryptJWE } = createJWE({ publicKey, privateKey })
        const jwe = await encryptJWE({ payload }, { alg: "RSA-OAEP-256", enc: "A256GCM" })
        const decryptedPayload = await decryptJWE<{ payload: string }>(jwe, {
            keyManagementAlgorithms: ["RSA-OAEP-256"],
            contentEncryptionAlgorithms: ["A256GCM"],
        })
        expect(decryptedPayload.payload).toMatchObject(payload)
    })

    test("verify createCompactJWE with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const { compactEncryptJWE, decryptCompactJWE } = createCompactJWE({ publicKey, privateKey })
        const jwe = await compactEncryptJWE(JSON.stringify(payload), { alg: "RSA-OAEP-256", enc: "A256GCM" })
        const decryptedPayload = await decryptCompactJWE(jwe, {
            keyManagementAlgorithms: ["RSA-OAEP-256"],
            contentEncryptionAlgorithms: ["A256GCM"],
        })
        expect(JSON.parse(decryptedPayload)).toMatchObject(payload)
    })
})

describe("JWTs", () => {
    test("create a signed and encrypted JWT using createJWS and createJWE functions", async () => {
        const secretKey = getRandomBytes(32)
        const derivedKey = await createDeriveKey(secretKey)

        const { signJWS, verifyJWS } = createJWS(derivedKey)
        const { encryptJWE, decryptJWE } = createJWE(derivedKey)

        const jws = await signJWS(payload)
        const jwe = await encryptJWE({ payload: jws })
        expect(jwe).toBeDefined()

        const decryptedJWS = await decryptJWE<{ payload: string }>(jwe)
        expect(decryptedJWS.payload).toBe(jws)

        const decodedPayload = await verifyJWS(decryptedJWS.payload)
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
        await expect(decodeJWT("invalid.jwt.token")).rejects.toThrow(/JWE decryption verification failed/)
    })

    test("createJWT with invalid secret", async () => {
        const { encodeJWT } = createJWT("short")
        await expect(encodeJWT(payload)).rejects.toThrow("Secret string must be at least 32 bytes long")
    })

    test("create a signed and encrypted JWT using createJWT with separate JWS and JWE secrets", async () => {
        const secret = getRandomBytes(32)
        const derivedSigningKey = await createDeriveKey(secret, "salt", "signing")
        const derivedEncryptionKey = await createDeriveKey(secret, "salt", "encryption")

        const { encodeJWT, decodeJWT } = createJWT({ sign: derivedSigningKey, encrypt: derivedEncryptionKey })

        const jwt = await encodeJWT(payload)
        expect(jwt).toBeDefined()
        const decodedPayload = await decodeJWT(jwt)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("encode and decode JWT with a single CryptoKeyPair", async () => {
        const signEntries = await generateKeyPair("RS256")
        const encryptEntries = await generateKeyPair("RSA-OAEP-256")

        const encoded = await encodeJWT(
            payload,
            {
                sign: signEntries,
                encrypt: encryptEntries,
            },
            {
                sign: { alg: "RS256" },
                encrypt: { alg: "RSA-OAEP-256", enc: "A256GCM" },
            }
        )

        const decoded = await decodeJWT(
            encoded,
            {
                sign: signEntries,
                encrypt: encryptEntries,
            },
            {
                verify: { algorithms: ["RS256"] },
                decrypt: { keyManagementAlgorithms: ["RSA-OAEP-256"], contentEncryptionAlgorithms: ["A256GCM"] },
            }
        )

        expect(decoded.sub).toBe(payload.sub)
        expect(decoded.name).toBe(payload.name)
        expect(decoded.email).toBe(payload.email)
    })

    test("createJWT supports CryptoKeyPair inputs", async () => {
        const signingKeyPair = await generateKeyPair("RS256")
        const encryptionKeyPair = await generateKeyPair("RSA-OAEP-256")
        const jwt = createJWT({
            sign: signingKeyPair,
            encrypt: encryptionKeyPair,
        })

        const token = await jwt.encodeJWT(payload, {
            sign: { alg: "RS256" },
            encrypt: { alg: "RSA-OAEP-256", enc: "A256GCM" },
        })

        const decoded = await jwt.decodeJWT(token, {
            verify: { algorithms: ["RS256"] },
            decrypt: { keyManagementAlgorithms: ["RSA-OAEP-256"], contentEncryptionAlgorithms: ["A256GCM"] },
        })

        expect(decoded.sub).toBe(payload.sub)
        expect(decoded.name).toBe(payload.name)
        expect(decoded.email).toBe(payload.email)
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

    test("createDeriveKey throws when given a CryptoKey", async () => {
        const cryptoKey = await globalThis.crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign"])
        await expect(createDeriveKey(cryptoKey as unknown as SecretInput)).rejects.toThrow("Cannot derive key from CryptoKey")
    })
})

describe("deriveKey", () => {
    test("deriveKey", async () => {
        const secret = "my-secret-password-123"
        const derivedKey1 = await deriveKey(encoder.encode(secret), "salt-1", "info-1")
        const derivedKey2 = await deriveKey(encoder.encode(secret), "salt-2", "info-2")
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

describe("createJWT", () => {
    test("createJWT with separate JWS and JWE secrets", async () => {
        const secret = getRandomBytes(32)
        const derivedSigningKey = await createDeriveKey(secret, "salt", "signing")
        const derivedEncryptionKey = await createDeriveKey(secret, "salt", "encryption")

        const { encodeJWT, decodeJWT } = createJWT({ sign: derivedSigningKey, encrypt: derivedEncryptionKey })

        const jwt = await encodeJWT(payload)
        expect(jwt).toBeDefined()
        const decodedPayload = await decodeJWT(jwt)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("createJWT with invalid secret", async () => {
        const { encodeJWT } = createJWT("short")
        await expect(encodeJWT(payload)).rejects.toThrow("Secret string must be at least 32 bytes long")
    })
})
