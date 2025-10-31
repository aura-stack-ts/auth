import { describe, test, expect } from "vitest"
import crypto from "node:crypto"
import type { JWTPayload } from "jose"
import { createJWS } from "@/sign.js"
import { createJWE } from "@/encrypt.js"
import { createSecret } from "@/secret.js"

describe("encode a JWT with JWS and JWE", () => {
    test("should create and verify a JWS", async () => {
        const { signJWS, verifyJWS } = createJWS("my-secret-key")

        const payload: JWTPayload = {
            sub: "user-123",
            name: "John Doe",
            email: "john.doe@example.com",
        }

        const jws = await signJWS(payload)
        expect(jws).toBeDefined()

        const decodedPayload = await verifyJWS(jws)
        expect(decodedPayload.sub).toBe(payload.sub)
        expect(decodedPayload.name).toBe(payload.name)
        expect(decodedPayload.email).toBe(payload.email)
    })

    test("should fail to verify an invalid JWS", async () => {
        const { verifyJWS } = createJWS("my-secret-key")
        await expect(verifyJWS("invalid.jwt.token")).rejects.toThrow("Invalid JWS")
    })

    test("should create and decrypt a JWE", async () => {
        const secret = crypto.randomBytes(32)
        const { signJWS } = createJWS(secret)
        const { encryptJWE, decryptJWE } = createJWE(secret)

        const payload: JWTPayload = {
            sub: "user-123",
            name: "John Doe",
            email: "john.doe@example.com",
        }

        const jws = await signJWS(payload)
        const jwe = await encryptJWE(jws)
        expect(jwe).toBeDefined()
        const decryptedJWS = await decryptJWE(jwe)
        expect(decryptedJWS).toBe(jws)
    })

    test("should fail to decrypt an invalid JWE", async () => {
        const secret = crypto.randomBytes(32)
        const { decryptJWE } = createJWE(secret)
        await expect(decryptJWE("header.payload.signature")).rejects.toThrow()
    })

    test("should create and verify a JWS and JWE", async () => {
        const secret = crypto.randomBytes(32)
        const { signJWS, verifyJWS } = createJWS(secret)
        const { encryptJWE, decryptJWE } = createJWE(secret)

        const payload: JWTPayload = {
            sub: "user-123",
            name: "John Doe",
            email: "john.doe@example.com",
        }

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

    test("createSecret", () => {
        const secretKey = createSecret("adfasdf")
        expect(secretKey).toBeDefined()
    })
})
