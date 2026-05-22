import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { GET, jose, oauthCustomService } from "@test/presets.ts"
import { createPKCE } from "@/shared/crypto.ts"
import { setCookie, getSetCookie } from "@/cookie.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"
import { createAuth } from "@/createAuth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("callbackAction", () => {
    test("invalid endpoint", async () => {
        const response = await GET(new Request("https://example.com/callback/invalid"))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            type: "ROUTER_ERROR",
            code: "ROUTER_INTERNAL_ERROR",
            message: "No route found for path: /callback/invalid",
        })
    })

    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "ROUTER_ERROR",
            code: "INVALID_REQUEST",
            message: {
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
            type: "ROUTER_ERROR",
            code: "INVALID_REQUEST",
            message: {
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
            type: "ROUTER_ERROR",
            code: "INVALID_REQUEST",
            message: {
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
            type: "AUTH_INTERNAL_ERROR",
            message: "No cookies found. There is no active session",
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
        expect(await response.json()).toEqual({
            type: "AUTH_SECURITY_ERROR",
            code: "MISMATCHING_STATE",
            message: "The provided state passed in the OAuth response does not match the stored state.",
        })
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
            // Additional fields that may be returned by the user info endpoint but don't included in identity schema
            extra_info: "extra_value",
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

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/access_token",
            expect.objectContaining({
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
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/userinfo",
            expect.objectContaining({
                method: "GET",
                headers: {
                    "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                    Accept: "application/json",
                    Authorization: "Bearer access_123",
                },
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledTimes(2)
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")

        expect(getSetCookie(response, "__Secure-aura-auth.session_token")).toBeDefined()
        expect(getSetCookie(response, "__Secure-aura-auth.state")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_to")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_uri")).toEqual("")

        const session = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(session).toMatchObject({
            sub: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            image: "https://example.com/john-doe.jpg",
        })
        expect(session).not.toHaveProperty("extra_info")
        expect(session).not.toHaveProperty("email_verified")
    })

    test("callback action workflow with strict schema validation", async () => {
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
            // Additional fields that may be returned by the user info endpoint but don't included in identity schema
            extra_info: "extra_value",
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
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oauth-provider")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("__Secure-aura-auth.code_verifier", codeVerifier)
        const GET = createAuth({
            oauth: [
                {
                    ...oauthCustomService,
                    profile: (profile) => ({
                        sub: profile.id,
                        email: profile.email,
                        name: profile.name,
                        image: profile.picture,
                        extra_info: profile.extra_info,
                        email_verified: profile.email_verified,
                    }),
                },
            ],
            identity: { unknownKeys: "strict" },
        }).handlers.GET
        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifierCookie].join("; "),
                },
            })
        )

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/access_token",
            expect.objectContaining({
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
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/userinfo",
            expect.objectContaining({
                method: "GET",
                headers: {
                    "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                    Accept: "application/json",
                    Authorization: "Bearer access_123",
                },
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledTimes(2)
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "AUTH_VALIDATION_ERROR",
            code: "INVALID_IDENTITY_VALIDATION_FAILED",
            message: expect.any(String),
        })
    })

    test("callback action workflow with passthrough schema validation", async () => {
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
            // Additional fields that may be returned by the user info endpoint but don't included in identity schema
            extra_info: "extra_value",
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
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oauth-provider")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("__Secure-aura-auth.code_verifier", codeVerifier)
        const GET = createAuth({
            oauth: [
                {
                    ...oauthCustomService,
                    profile: (profile) => ({
                        sub: profile.id,
                        email: profile.email,
                        name: profile.name,
                        image: profile.picture,
                        extra_info: profile.extra_info,
                        email_verified: profile.email_verified,
                    }),
                },
            ],
            identity: { unknownKeys: "passthrough" },
        }).handlers.GET
        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifierCookie].join("; "),
                },
            })
        )

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/access_token",
            expect.objectContaining({
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
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledWith(
            "https://example.com/oauth/userinfo",
            expect.objectContaining({
                method: "GET",
                headers: {
                    "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                    Accept: "application/json",
                    Authorization: "Bearer access_123",
                },
                signal: expect.any(AbortSignal),
            })
        )

        expect(fetch).toHaveBeenCalledTimes(2)
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")

        expect(getSetCookie(response, "__Secure-aura-auth.session_token")).toBeDefined()
        expect(getSetCookie(response, "__Secure-aura-auth.state")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_to")).toEqual("")
        expect(getSetCookie(response, "__Secure-aura-auth.redirect_uri")).toEqual("")

        const session = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(session).toMatchObject({
            sub: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            image: "https://example.com/john-doe.jpg",
            extra_info: "extra_value",
            email_verified: true,
        })
    })
})
