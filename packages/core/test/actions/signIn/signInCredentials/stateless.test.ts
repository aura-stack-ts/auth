import { describe, test, expect, beforeEach, vi } from "vitest"
import { jose, POST } from "@test/presets.ts"
import { getSetCookie } from "@/cookie.ts"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("signInCredentials action", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signIn flow", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            email: "johndoe@example.com",
            name: "johndoe",
            image: "https://example.com/image.jpg",
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
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "wrongpassword",
                }),
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
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
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                } as any),
            })
        )
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
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
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890-abcdef",
            name: "johndoe",
        })
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("credentials with redirect: true (by default)", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("credentials with redirect: true and redirectTo", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("credentials with redirect: false", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirect=false", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("credentials with redirect: false and redirectTo", async () => {
        const response = await POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirect=false&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response.headers, "aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
    })
})
