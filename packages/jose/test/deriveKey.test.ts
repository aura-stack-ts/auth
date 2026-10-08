import { describe, test, expect } from "vitest"
import { encoder, getRandomBytes } from "@/crypto.ts"
import { deriveKey, createDeriveKey } from "@/deriveKey.ts"
import type { SecretInput } from "@/index.ts"

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
