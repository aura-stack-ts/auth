import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { GET, jose, oauthCustomService, openIDCustomProvider, openIDMetadata, RS256PEMFormat } from "@test/presets.ts"
import { clearResolvedProviderCache } from "@/actions/oidc/resolve-provider.ts"
import { clearJWKSCache } from "@/actions/oidc/jwks.ts"
import { SignJWT, exportJWK, importPKCS8, importSPKI } from "@aura-stack/jose/jose"
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
            type: "ROUTER_FLOW",
            code: "NOT_FOUND",
            message: "The requested route address cannot be found or is unavailable on this application endpoint server context.",
        })
    })

    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
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
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
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
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    test("without cookies", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc"))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            type: "AUTH_FLOW",
            code: "COOKIE_NOT_FOUND",
            message: "No cookies found. There is no active session.",
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
            type: "PROTOCOL",
            code: "AUTH_MISMATCHING_STATE",
            message: "The provided state passed in the OAuth response does not match the stored token state.",
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
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
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
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
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
                    profile: (profile: Record<string, string>) => ({
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
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "SCHEMA_PARSER_FAILED",
            message:
                "An internal schema parsing error occurred. Please verify your schema configuration and validation adapter setup.",
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
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
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
                    profile: (profile: Record<string, string>) => ({
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

    test("OIDC callback workflow with id_token validation", async () => {
        clearResolvedProviderCache()
        clearJWKSCache()

        const nonce = "oidc-callback-nonce"
        const privateKey = await importPKCS8(RS256PEMFormat.privateKey, "RS256")
        const publicKey = await importSPKI(RS256PEMFormat.publicKey, "RS256")
        const jwk = await exportJWK(publicKey)
        const now = Math.floor(Date.now() / 1000)
        const id_token = await new SignJWT({ sub: "user-123", nonce })
            .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
            .setIssuer("https://id.example.com")
            .setAudience("oidc_client_id")
            .setIssuedAt(now)
            .setExpirationTime(now + 3600)
            .sign(privateKey)

        const mockFetch = vi.fn(async (url: string) => {
            if (url.includes("openid-configuration")) {
                return {
                    ok: true,
                    headers: new Headers({ "Content-Type": "application/json" }),
                    json: async () => openIDMetadata,
                }
            }
            if (url.includes("/oauth/token")) {
                return {
                    ok: true,
                    headers: new Headers({ "Content-Type": "application/json" }),
                    json: async () => ({
                        access_token: "access_123",
                        id_token,
                        token_type: "Bearer",
                    }),
                }
            }
            if (url.includes("/oauth/jwks")) {
                return {
                    ok: true,
                    headers: new Headers({ "Content-Type": "application/json" }),
                    json: async () => ({ keys: [{ ...jwk, kid: "test-kid", use: "sig", alg: "RS256" }] }),
                }
            }
            if (url.includes("userinfo")) {
                return {
                    ok: true,
                    headers: new Headers({ "Content-Type": "application/json" }),
                    json: async () => ({
                        sub: "user-123",
                        email: "john@example.com",
                        name: "John Doe",
                        picture: "https://example.com/pic.jpg",
                    }),
                }
            }
            throw new Error(`Unexpected fetch: ${url}`)
        })
        vi.stubGlobal("fetch", mockFetch)

        const oidcGET = createAuth({ oauth: [openIDCustomProvider] }).handlers.GET

        const state = setCookie("__Secure-aura-auth.state", "abc")
        const redirectURI = setCookie("__Secure-aura-auth.redirect_uri", "https://example.com/auth/callback/oidc-provider")
        const redirectTo = setCookie("__Secure-aura-auth.redirect_to", "/auth")
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("__Secure-aura-auth.code_verifier", codeVerifier)
        const nonceCookie = setCookie("__Secure-aura-auth.nonce", nonce)

        const response = await oidcGET(
            new Request("https://example.com/auth/callback/oidc-provider?code=auth_code_123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifierCookie, nonceCookie].join("; "),
                },
            })
        )

        expect(response.status).toBe(302)
        expect(mockFetch).toHaveBeenCalledWith(openIDMetadata.token_endpoint, expect.objectContaining({ method: "POST" }))
        expect(mockFetch).toHaveBeenCalledWith(openIDMetadata.userinfo_endpoint, expect.objectContaining({ method: "GET" }))

        expect(getSetCookie(response, "__Secure-aura-auth.session_token")).toBeDefined()

        const session = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(session).toMatchObject({
            sub: "user-123",
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/pic.jpg",
        })
    })
})
