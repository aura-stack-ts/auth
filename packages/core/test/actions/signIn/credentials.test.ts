import { getSetCookie } from "@/cookie.ts"
import { createAuth } from "@/createAuth.ts"
import { POST } from "@test/presets.ts"
import { describe, test, expect } from "vitest"

describe("signInCredentials action", () => {
    test("success signIn flow", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                }),
            })
        )
        const data = await response.json()
        expect(response.status).toBe(200)
        expect(data).toMatchObject({
            success: true,
        })
    })

    test("invalid credentials", async () => {
        const {
            handlers: { POST },
        } = createAuth({
            oauth: [],
            credentials: {
                authorize: () => null,
            },
        })
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({
                    username: "johndoe",
                    password: "wrongpassword",
                }),
            })
        )
        const data = await response.json()
        expect(response.status).toBe(401)
        expect(data).toMatchObject({
            success: false,
        })
    })

    test("invalid authorize by missing required fields", async () => {
        const {
            handlers: { POST },
        } = createAuth({
            oauth: [],
            credentials: {
                authorize: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as any,
            },
        })
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                } as any),
            })
        )
        const data = await response.json()
        expect(response.status).toBe(401)
        expect(data).toMatchObject({
            success: false,
        })
    })

    test("simulate hashing and verification", async () => {
        const {
            jose,
            handlers: { POST },
        } = createAuth({
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
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        const decoded = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decoded).toMatchObject({
            sub: "1234567890-abcdef",
            name: "johndoe",
        })
    })
})
