import { describe, test, expect } from "vitest"
import { getRandomBytes } from "@/crypto.ts"
import { createJWS, signJWS } from "@/sign.ts"
import { createDeriveKey } from "@/deriveKey.ts"
import { generateKeyPair, type JWTPayload } from "jose"
import { createCompactJWE, createJWE, decryptCompactJWE, decryptJWE, encryptJWE, encryptCompactJWE } from "@/encrypt.ts"

const payload: JWTPayload = {
    sub: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
}

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

        const compactJWE = await encryptCompactJWE(jws, secretKey)
        expect(compactJWE).toBeDefined()

        const decryptedJWS = await decryptCompactJWE(compactJWE, secretKey)
        expect(decryptedJWS).toBe(jws)
    })

    test("encrypt and decrypt compact JWE payload using createCompactJWE", async () => {
        const secretKey = getRandomBytes(32)
        const jws = await signJWS(payload, secretKey)
        const { encryptCompactJWE, decryptCompactJWE } = createCompactJWE(secretKey)

        const compactJWE = await encryptCompactJWE(jws)
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
        const { encryptCompactJWE, decryptCompactJWE } = createCompactJWE({ publicKey, privateKey })
        const jwe = await encryptCompactJWE(JSON.stringify(payload), { alg: "RSA-OAEP-256", enc: "A256GCM" })
        const decryptedPayload = await decryptCompactJWE(jwe, {
            keyManagementAlgorithms: ["RSA-OAEP-256"],
            contentEncryptionAlgorithms: ["A256GCM"],
        })
        expect(JSON.parse(decryptedPayload)).toMatchObject(payload)
    })

    test("verify JWK with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256", { extractable: true })
        const publicJWK = await crypto.subtle.exportKey("jwk", publicKey)
        const privateJWK = await crypto.subtle.exportKey("jwk", privateKey)
        const { encryptJWE, decryptJWE } = createJWE({
            publicKey: publicJWK,
            privateKey: privateJWK,
        })
        const signed = await encryptJWE(payload, { alg: "RSA-OAEP-256" })
        const verified = await decryptJWE(signed, { keyManagementAlgorithms: ["RSA-OAEP-256"] })
        expect(verified).toMatchObject(payload)
    })

    test("encrypt and decrypt with dir algorithm using createJWE", async () => {
        const secretKey = getRandomBytes(32)
        const { encryptJWE, decryptJWE } = createJWE(secretKey)
        const jwe = await encryptJWE(payload, { alg: "dir", enc: "A256GCM" })
        await expect(
            decryptJWE(jwe, {
                keyManagementAlgorithms: ["dir"],
                contentEncryptionAlgorithms: ["A128GCM"],
            })
        ).rejects.toThrow("JWE decryption verification failed")
    })

    test("encrypt and decrypt with dir algorithm using createCompactJWE", async () => {
        const secretKey = getRandomBytes(32)
        const { encryptCompactJWE, decryptCompactJWE } = createCompactJWE(secretKey)
        const jwe = await encryptCompactJWE(JSON.stringify(payload), { alg: "dir", enc: "A256GCM" })
        await expect(
            decryptCompactJWE(jwe, {
                keyManagementAlgorithms: ["dir"],
                contentEncryptionAlgorithms: ["RSA-OAP-256"],
            })
        ).rejects.toThrow("JWE decryption verification failed")
    })

    test("infer algorithm from CryptoKey type", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const jwe = await encryptJWE({ payload }, publicKey)
        const decryptedPayload = await decryptJWE<{ payload: string }>(jwe, privateKey)
        expect(decryptedPayload.payload).toMatchObject(payload)
    })

    test("infer algorithm from CryptoKey type with compact serialization", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const jwe = await encryptCompactJWE(JSON.stringify(payload), publicKey)
        const decryptedPayload = await decryptCompactJWE(jwe, privateKey)
        expect(JSON.parse(decryptedPayload)).toMatchObject(payload)
    })

    test("infer algorithm from CryptoKey type using createJWE", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const { encryptJWE, decryptJWE } = createJWE({ publicKey, privateKey })
        const jwe = await encryptJWE({ payload })
        const decryptedPayload = await decryptJWE<{ payload: string }>(jwe)
        expect(decryptedPayload.payload).toMatchObject(payload)
    })

    test("infer algorithm from CryptoKey type using createCompactJWE", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256")
        const { encryptCompactJWE, decryptCompactJWE } = createCompactJWE({ publicKey, privateKey })
        const jwe = await encryptCompactJWE(JSON.stringify(payload), { alg: "RSA-OAEP-256", enc: "A256GCM" })
        const decryptedPayload = await decryptCompactJWE(jwe, {
            keyManagementAlgorithms: ["RSA-OAEP-256"],
            contentEncryptionAlgorithms: ["A256GCM"],
        })
        expect(JSON.parse(decryptedPayload)).toMatchObject(payload)
    })
})
