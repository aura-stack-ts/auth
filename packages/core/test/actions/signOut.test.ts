import { describe, test, expect, vi } from "vitest"
import { signOutAction } from "@/actions/signOut.js"
import { createRouter } from "@aura-stack/router"
import { encodeJWT, type JWTPayload } from "@/jose.js"
import { SESSION_VERSION } from "@/actions/session/session.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { defaultCookieConfig } from "@/cookie.js"

const oauth = createOAuthIntegrations([])

const { POST } = createRouter([signOutAction({ oauth, cookies: defaultCookieConfig })])

describe("signOut action", () => {
    test("sessionToken cookie not present", async () => {
        const response = await POST(
            new Request("https://example.com/signOut?token_type_hint=session_token", {
                method: "POST",
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
    })

    test("invalid sessionToken cookie", async () => {
        const request = await POST(
            new Request("https://example.com/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: "__Secure-aura-stack.sessionToken=invalid_token",
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
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
        const request = await POST(
            new Request("https://example.com/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
        decodeJWTMock.mockRestore()
    })

    test("valid sessionToken cookie", async () => {
        const payload: JWTPayload = {
            sub: "1234567890",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            integrations: ["github"],
            version: SESSION_VERSION,
        }
        const sessionToken = await encodeJWT(payload)
        const request = await POST(
            new Request("https://example.com/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-stack.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(200)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("aura-stack.sessionToken=;")
    })
})
