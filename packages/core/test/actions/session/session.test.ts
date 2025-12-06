import { GET, sessionPayload } from "@test/presets.js"
import { describe, test, expect, vi } from "vitest"
import { encodeJWT, type JWTPayload } from "@/jose.js"

describe("sessionAction", () => {
    test("sessionToken cookie not found", async () => {
        const request = await GET(new Request("https://example.com/auth/session"))
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
    })

    test("invalid sessionToken cookie", async () => {
        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "aura-auth.sessionToken=invalidtoken",
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
    })

    test("valid sessionToken cookie with correct version", async () => {
        const sessionToken = await encodeJWT(sessionPayload)

        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(200)
        expect(await request.json()).toEqual({ user: sessionPayload, authenticated: true })
    })

    test("valid sessionToken cookie with incorrect version", async () => {
        const payload: JWTPayload = {
            ...sessionPayload,
            version: "incorrect_version",
        }
        const sessionToken = await encodeJWT(payload)

        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
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

        const sessionToken = await encodeJWT(sessionPayload)
        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ authenticated: false, message: "Unauthorized" })
        decodeJWTMock.mockRestore()
    })

    test("verify cache control headers are set", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
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
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await GET(
            new Request("http://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.headers.get("Set-Cookie")).toMatch("aura-auth.sessionToken=;")
    })

    test("invalid access from https", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.headers.get("Set-Cookie")).toMatch("aura-auth.sessionToken=;")
    })
})
