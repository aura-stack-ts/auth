import crypto from "node:crypto"
import { describe, test, expect } from "vitest"
import type { JWTPayload } from "jose"
import { createJWS, signJWS, verifyJWS } from "@/sign.js"
import { createJWE, encryptJWE, decryptJWE } from "@/encrypt.js"
import { createSecret } from "@/secret.js"
import { createJWT } from "@/index.js"

const payload: JWTPayload = {
    sub: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
}

describe("JWSs", () => {
    test("sign and verify a JWS using signJWS and verifyJWS", async () => {
        const secretKey = crypto.randomBytes(32)

        const jws = await signJWS(payload, secretKey)
        expect(jws).toBeDefined()

        const decodedPayload = await verifyJWS(jws, secretKey)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("sign and verify a JWS using createJWS", async () => {
        const secretKey = crypto.randomBytes(32)
        const { signJWS, verifyJWS } = createJWS(secretKey)

        const jws = await signJWS(payload)
        expect(jws).toBeDefined()

        const decodedPayload = await verifyJWS(jws)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("fail JWT to try to verify an invalid JWS", async () => {
        const { verifyJWS } = createJWS("my-secret-key")
        await expect(verifyJWS("invalid.jwt.token")).rejects.toThrow("Invalid JWS")
    })

    test("fail JWT to try to verify a JWS with invalid secret", async () => {
        const secretKey = crypto.randomBytes(32)

        const jws = await signJWS(payload, secretKey)
        expect(jws).toBeDefined()

        const { verifyJWS } = createJWS("wrong-secret-key")
        await expect(verifyJWS(jws)).rejects.toThrow("Invalid JWS")
    })
})

describe("JWEs", () => {
    test("encrypt and decrypt a JWE using encryptJWE and decryptJWE", async () => {
        const secret = crypto.randomBytes(32)

        const jwe = await encryptJWE(JSON.stringify(payload), secret)
        expect(jwe).toBeDefined()

        const decryptedPayload = await decryptJWE(jwe, secret)
        const decodedPayload = JSON.parse(decryptedPayload) as JWTPayload
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("encrypt and decrypt a JWE using createJWE", async () => {
        const secret = crypto.randomBytes(32)
        const { signJWS } = createJWS(secret)
        const { encryptJWE, decryptJWE } = createJWE(secret)

        const jws = await signJWS(payload)
        const jwe = await encryptJWE(jws)
        expect(jwe).toBeDefined()

        const decryptedJWS = await decryptJWE(jwe)
        expect(decryptedJWS).toBe(jws)
    })

    test("fail JWT to try to decrypt an invalid JWE", async () => {
        const secret = crypto.randomBytes(32)
        const { decryptJWE } = createJWE(secret)
        await expect(decryptJWE("header.payload.signature")).rejects.toThrow()
    })
})

describe("JWTs", () => {
    test("create a signed and encrypted JWT using createJWS and createJWE functions", async () => {
        const secret = crypto.randomBytes(32)
        const { signJWS, verifyJWS } = createJWS(secret)
        const { encryptJWE, decryptJWE } = createJWE(secret)

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
        const secret = crypto.randomBytes(32)
        const { encodeJWT, decodeJWT } = createJWT(secret)

        const jwt = await encodeJWT(payload)
        expect(jwt).toBeDefined()

        const decodedPayload = await decodeJWT(jwt)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("fail JWT to try to decode an invalid JWT", async () => {
        const secret = crypto.randomBytes(32)
        const { decodeJWT } = createJWT(secret)
        await expect(decodeJWT("invalid.jwt.token")).rejects.toThrow()
    })

    test("createJWT with invalid secret", async () => {
        /**
         * Jose expects a secret of at least 32 bytes for HS256
         */
        const { encodeJWT } = createJWT("short")
        const payload: JWTPayload = {
            sub: "user-123",
            name: "John Doe",
            email: "john.doe@example.com",
        }

        await expect(encodeJWT(payload)).rejects.toThrow()
    })
})

describe("createSecret", () => {
    test("createSecret", () => {
        const secretKey = createSecret("adfasdf")
        expect(secretKey).toBeDefined()
    })

    test("createSecret with 256 bits", () => {
        const secretKey = crypto.randomBytes(32)
        const secret = createSecret(secretKey)
        expect(secret).toBeDefined()
    })
})
