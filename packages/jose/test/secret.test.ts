import { describe, test, expect } from "vitest"
import { createSecret, MIN_SECRET_ENTROPY_BITS, MIN_SECRET_ENTROPY_PER_CHAR } from "@/secret.ts"
import { getRandomBytes } from "@/crypto.ts"
import { base64url } from "jose"

describe("createSecret", () => {
    test("createSecret without secret", () => {
        const secret = undefined
        expect(() => createSecret(secret as unknown as string)).toThrow("Secret is required")
    })

    test("createSecret with string secret with at least 32 bytes", () => {
        const secretString = "this-is-a-very-secure-and-long-secret"
        expect(() => createSecret(secretString)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
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
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with low entropy string - repeated characters", () => {
        const secret = "mysecretmysecretmysecretmysecret"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with low entropy string - 3.9015 bits per character", () => {
        const secret = "7b3fa92e1c8d0e5b6a4f7c2d8e1b0a9f3e"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with low entropy string - 3.9032 bits per character", () => {
        const secret = "9a4b3d7e2f0c1b8d5e9a4f3c7b2e0d1f8a5b9c4e"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with low entropy string - 3.9074 bits per character", () => {
        const secret = "a8f2c7b1d0e93fa4b6c8d2e1f0a93b4c7d8e2f1a0b93c4d7e8f2b1c0a93b4c7d"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with 50 characters", () => {
        const secret = "8f2c7b3a9e1d0c4b8f2c7b3a9e1d0c4b8f2c7b3a9e1d0c4b8f"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("createSecret with 66 characters", () => {
        const secret = "4b2d7e0f1a9c3b5d8e2f0a1c9b3d5e8f2a0c1b9d3e5f8a2c1b9d3e5f8a2c1b9d3e"
        expect(() => createSecret(secret)).toThrow(
            `Secret must have an entropy of at least ${MIN_SECRET_ENTROPY_PER_CHAR} bits per character and a total entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits`
        )
    })

    test("secret from getRandomBytes", () => {
        const secret = getRandomBytes(32)
        const createdSecret = createSecret(secret)
        expect(createdSecret).toBe(secret)
    })

    test("secret from getRandomBytes to string", () => {
        const secret = getRandomBytes(32).toString()
        const encodedSecret = base64url.encode(secret)
        const createdSecret = createSecret(encodedSecret)
        expect(createdSecret).toBeInstanceOf(Uint8Array)
    })
})
