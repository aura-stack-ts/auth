import { describe, test, expect, vi } from "vitest"
import { GET } from "@test/presets.js"
import { createPKCE } from "@/secure.js"
import { setCookie, getSetCookie } from "@/cookie.js"

describe("callbackAction", () => {
    test("invalid endpoint", async () => {
        const response = await GET(new Request("https://example.com/callback/invalid"))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "No route found for path: /callback/invalid",
        })
    })

    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            errors: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    test("supported oauth provider endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            errors: {
                code: {
                    code: "invalid_type",
                    message: "Missing code parameter in the OAuth authorization response.",
                },
                state: {
                    code: "invalid_type",
                    message: "Missing state parameter in the OAuth authorization response.",
                },
            },
        })
    })

    test("unsupported oauth provider", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown?code=123&state=abc"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            errors: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    test("without cookies", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "No cookies found. There is no active session",
        })
    })

    test("mismatching state", async () => {
        const state = setCookie("__Secure-aura-auth.state", "123")
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oauth-provider")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const codeVerifier = setCookie("__Secure-aura-auth.code_verifier", "verifier_123")

        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifier].join("; "),
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Mismatching state" })
    })

    test("callback action workflow", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        const userInfoMock = {
            id: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            picture: "https://example.com/john-doe.jpg",
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
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oauth-provider")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("__Secure-aura-auth.code_verifier", codeVerifier)
        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc", {
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
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
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

        expect(getSetCookie(response, "__Secure-aura-auth.sessionToken")).toBeDefined()
        expect(getSetCookie(response, "__Secure-aura-auth.state")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_to")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_uri")).toEqual("")
    })
})
