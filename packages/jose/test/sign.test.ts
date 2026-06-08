import { describe, test, expect } from "vitest"
import { createDeriveKey } from "@/deriveKey.ts"
import { encoder, getRandomBytes } from "@/crypto.ts"
import { generateKeyPair, type JWTPayload } from "jose"
import { createJWS, signJWS, verifyJWS } from "@/sign.ts"

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

    test("verify JWK with RSA algorithm", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true })
        const publicJWK = await crypto.subtle.exportKey("jwk", publicKey)
        const privateJWK = await crypto.subtle.exportKey("jwk", privateKey)
        const { signJWS, verifyJWS } = createJWS({
            publicKey: publicJWK,
            privateKey: privateJWK,
        })
        const signed = await signJWS(payload, { alg: "RS256" })
        const verified = await verifyJWS(signed, { algorithms: ["RS256"] })
        expect(verified).toMatchObject(payload)
    })

    test("sign and verify with HMAC algorithm", async () => {
        const secretKey = getRandomBytes(32)
        const signed = await signJWS(payload, secretKey)
        await expect(
            verifyJWS(signed, secretKey, {
                algorithms: ["RS256"],
            })
        ).rejects.toThrow("JWS signature verification failed")
    })

    test("infer algorithm from key type", async () => {
        const { publicKey, privateKey } = await generateKeyPair("RS256")
        const signed = await signJWS(payload, privateKey)
        const verified = await verifyJWS(signed, publicKey)
        expect(verified).toMatchObject(payload)
    })

    test("infer asymmetric algorithm from the key type", async () => {
        const entries = await generateKeyPair("RS256")
        const { signJWS, verifyJWS } = createJWS(entries)
        const signed = await signJWS(payload)
        const verified = await verifyJWS(signed)
        expect(verified).toMatchObject(payload)
    })
})
