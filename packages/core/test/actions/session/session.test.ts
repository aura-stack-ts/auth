import { sessionAction } from "@/actions/index.js"
import { createRouter } from "@aura-stack/router"
import { describe, test, expect, vi } from "vitest"
import { encodeJWT, type JWTPayload } from "@/jose.js"
import { SESSION_VERSION } from "@/actions/session/session.js"
import { defaultCookieConfig } from "@/cookie.js"
import { createOAuthIntegrations } from "@/oauth/index.js"

const oauth = createOAuthIntegrations([])

const { GET } = createRouter([sessionAction({ oauth, cookies: defaultCookieConfig })])

describe("sessionAction", () => {
    test("sessionToken cookie not found", async () => {
        const request = await GET(new Request("https://example.com/session"))
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
    })

    test("invalid sessionToken cookie", async () => {
        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: "aura_auth.sessionToken=invalidtoken",
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
    })

    test("valid sessionToken cookie with correct version", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }
        const sessionToken = await encodeJWT(payload)

        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(200)
        expect(await request.json()).toEqual({ user: payload, authenticated: true })
    })

    test("valid sessionToken cookie with incorrect version", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: "incorrect_version",
        }
        const sessionToken = await encodeJWT(payload)

        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
    })

    test("expired sessionToken cookie", async () => {
        const decodeJWTMock = vi.spyOn(await import("@/jose.js"), "decodeJWT").mockImplementation(() => {
            throw new Error("Token expired")
        })

        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }
        const sessionToken = await encodeJWT(payload)
        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
        decodeJWTMock.mockRestore()
    })

    test("verify cache control headers are set", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }

        const sessionToken = await encodeJWT(payload)
        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        const headers = request.headers
        expect(headers.get("Cache-Control")).toBe("no-store")
        expect(headers.get("Pragma")).toBe("no-cache")
        expect(headers.get("Expires")).toBe("0")
        expect(headers.get("Vary")).toBe("Cookie")
    })

    test("invalid access from http", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }

        const sessionToken = await encodeJWT(payload)
        const request = await GET(
            new Request("http://example.com/session", {
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.headers.get("Set-Cookie")).toMatch("aura-stack.sessionToken=;")
    })

    test("invalid access from https", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }

        const sessionToken = await encodeJWT(payload)
        const request = await GET(
            new Request("https://example.com/session", {
                headers: {
                    Cookie: `aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.headers.get("Set-Cookie")).toMatch("aura-stack.sessionToken=;")
    })
})
