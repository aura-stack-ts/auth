import { describe, test, expect } from "vitest"
import { createJWS } from "@/sign.ts"
import { createJWE } from "@/encrypt.ts"
import { getRandomBytes } from "@/crypto.ts"
import { createDeriveKey } from "@/deriveKey.ts"
import { generateKeyPair, type JWTPayload } from "jose"
import { createJWT, decodeJWT, encodeJWT } from "@/index.ts"

const payload: JWTPayload = {
    sub: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
}

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

    test("createJWT with JWK keys", async () => {
        const { publicKey: signPublicKey, privateKey: signPrivateKey } = await generateKeyPair("RS256", { extractable: true })
        const { publicKey: encryptPublicKey, privateKey: encryptPrivateKey } = await generateKeyPair("RSA-OAEP-256", {
            extractable: true,
        })
        const signPublicJWK = await crypto.subtle.exportKey("jwk", signPublicKey)
        const signPrivateJWK = await crypto.subtle.exportKey("jwk", signPrivateKey)
        const encryptPublicJWK = await crypto.subtle.exportKey("jwk", encryptPublicKey)
        const encryptPrivateJWK = await crypto.subtle.exportKey("jwk", encryptPrivateKey)
        const jwt = createJWT({
            sign: { publicKey: signPublicJWK, privateKey: signPrivateJWK },
            encrypt: { publicKey: encryptPublicJWK, privateKey: encryptPrivateJWK },
        })

        const encoded = await jwt.encodeJWT(payload, {
            sign: { alg: "RS256" },
            encrypt: { alg: "RSA-OAEP-256", enc: "A256GCM" },
        })
        const decoded = await jwt.decodeJWT(encoded, {
            verify: { algorithms: ["RS256"] },
            decrypt: { keyManagementAlgorithms: ["RSA-OAEP-256"], contentEncryptionAlgorithms: ["A256GCM"] },
        })
        expect(decoded).toMatchObject(payload)
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
