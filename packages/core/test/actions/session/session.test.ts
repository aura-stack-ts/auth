import { setCookie, getSetCookie } from "@/cookie.js"
import { createPKCE } from "@/secure.js"
import { GET, jose, sessionPayload } from "@test/presets.js"
import { describe, test, expect, vi } from "vitest"

describe("sessionAction", () => {
    const { encodeJWT } = jose

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
        expect(await request.json()).toEqual({ user: sessionPayload, expires: expect.any(String) })
    })

    test("expired sessionToken cookie", async () => {
        const decodeJWTMock = vi.spyOn(jose, "decodeJWT").mockImplementation(async () => {
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

    test("update default profile function", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        /**
         * Mock user info response. For this case it simulates the profile function
         */
        const userInfoMock = {
            id: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            image: "https://example.com/john-doe.jpg",
            username: "johndoe",
            nickname: "johnny",
            email_verified: true,
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => userInfoMock,
        })

        const state = setCookie("__Secure-aura-auth.state", "abc")
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oauth-profile")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("__Secure-aura-auth.code_verifier", codeVerifier)
        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-profile?code=auth_code_123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifierCookie].join("; "),
                },
            })
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "auth_code_123",
                redirect_uri: "https://example.com/auth/callback/oauth-profile",
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }).toString(),
        })

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_123",
            },
        })
        expect(fetch).toHaveBeenCalledTimes(2)
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")
        const sessionToken = getSetCookie(response, "__Secure-aura-auth.sessionToken")
        expect(sessionToken).toBeDefined()

        const requestSession = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        const session = await requestSession.json()
        const { id, ...rest } = userInfoMock
        expect(session).toEqual({
            user: { sub: id, ...rest },
            expires: expect.any(String),
        })
    })
})
