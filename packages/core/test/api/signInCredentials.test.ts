import { describe, test, expect } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { getSetCookie } from "@/cookie.ts"
import { api, jose } from "@test/presets.ts"

describe("signInCredentials API", () => {
    test("success signIn flow", async () => {
        const { headers, success } = await api.signInCredentials({
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(success).toBe(true)
        const decoded = await jose.decodeJWT(getSetCookie(headers, "aura-auth.session_token")!)
        expect(decoded).toMatchObject({
            sub: "1234567890",
            email: "johndoe@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
        })
    })

    test("invalid authorize return", async () => {
        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: () => null,
            },
        })
        const { success } = await api.signInCredentials({
            payload: {
                username: "johndoe",
                password: "wrongpassword",
            },
        })
        expect(success).toBe(false)
    })

    test("invalid authorize by missing required fields", async () => {
        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as any,
            },
        })
        const { success } = await api.signInCredentials({
            payload: {
                username: "johndoe",
                password: "1234567890",
            } as any,
        })
        expect(success).toBe(false)
    })

    test("simulate hashing and verification", async () => {
        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: async (ctx) => {
                    // Simulate password hashing and verification
                    const hash = await ctx.deriveSecret(ctx.credentials.password, "salt")
                    const isVerified = await ctx.verifySecret(ctx.credentials.password, hash)
                    if (!isVerified) return null
                    return {
                        sub: "1234567890-abcdef",
                        name: ctx.credentials.username,
                    }
                },
            },
        })
        const { headers, success } = await api.signInCredentials({
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(success).toBe(true)
        const decoded = await jose.decodeJWT(getSetCookie(headers, "aura-auth.session_token")!)
        expect(decoded).toMatchObject({
            sub: "1234567890-abcdef",
            name: "johndoe",
        })
    })
})
