import { describe, test, expect } from "vitest"
import { createAuth } from "@/index.js"
import { getSetCookie } from "@/cookie.js"
import { GET, oauthCustomService } from "@test/presets.js"

describe("signIn action", () => {
    test("rejects unsupported OAuth provider", async () => {
        const request = await GET(new Request("http://example.com/auth/signIn/unsupported"))
        expect(request.status).toBe(422)
        expect(await request.json()).toEqual({
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

    test("stores redirectTo cookie over HTTPS", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(new Request("https://example.com/auth/signIn/oauth-provider?redirectTo=/dashboard"))
        expect(getSetCookie(request, "__Secure-aura-auth.redirect_to")).toEqual("/dashboard")
    })

    test("stores redirectTo cookie over HTTP", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(new Request("http://example.com/auth/signIn/oauth-provider?redirectTo=/dashboard"))
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("/dashboard")
    })

    test("stores redirectTo when origin is trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedOrigins: ["http://app.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider?redirectTo=http://app.com/dashboard")
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("http://app.com/dashboard")
    })

    test("falls back to root when redirectTo origin is untrusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider?redirectTo=http://app.com/dashboard")
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("/")
    })

    test("uses same-origin Referer as redirectTo", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://example.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("/dashboard")
    })

    test("falls back to root when Referer is cross-origin", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("/")
    })

    test("accepts cross-origin Referer when origin is trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedOrigins: ["http://app.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("http://app.com/dashboard")
    })

    test("rejects cross-origin Referer when trusted proxy headers are used", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.com/dashboard",
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "app.com",
                },
            })
        )
        expect(await request.json()).toEqual({
            type: "AUTH_INTERNAL_ERROR",
            message: "The constructed origin URL is not trusted.",
        })
    })

    test("accepts cross-origin Referer when trusted proxy headers and origins are set", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
            trustedOrigins: ["http://app.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.com/dashboard",
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "app.com",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("http://app.com/dashboard")
    })

    test("rejects subdomain Referer when wildcard origin is not trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.example.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("/")
    })

    test("accepts subdomain Referer when wildcard origin is trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedOrigins: ["http://*.example.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.example.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("http://app.example.com/dashboard")
    })

    test("rejects proxy-derived origin when trusted origins are not configured", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://evil.com/dashboard",
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "app.example.com",
                },
            })
        )
        expect(await request.json()).toEqual({
            type: "AUTH_INTERNAL_ERROR",
            message: "The constructed origin URL is not trusted.",
        })
    })

    test("rejects proxy-derived origin not present in trustedOrigins", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
            trustedOrigins: ["http://example.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://evil.com/dashboard",
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "app.example.com",
                },
            })
        )
        expect(await request.json()).toEqual({
            type: "AUTH_INTERNAL_ERROR",
            message: "The constructed origin URL is not trusted.",
        })
    })

    test("stores redirectTo for subdomain when wildcard origin is trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedOrigins: ["http://*.example.com"],
        })
        const request = await GET(
            new Request("http://example.com/auth/signIn/oauth-provider", {
                headers: {
                    Referer: "http://app.example.com/dashboard",
                },
            })
        )
        expect(getSetCookie(request, "aura-auth.redirect_to")).toEqual("http://app.example.com/dashboard")
    })

    test("builds redirect URL using request origin without proxy headers", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
        })
        const request = await GET(new Request("https://example.com/auth/signIn/oauth-provider"))

        const headers = new Headers(request.headers)
        const location = headers.get("Location")!
        const searchParams = new URL(location).searchParams
        expect(location).toMatch(
            new URLSearchParams({
                response_type: "code",
                client_id: "oauth_client_id",
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
                state: searchParams.get("state")!,
            }).toString()
        )
    })

    test("builds redirect URL from trusted proxy headers with same origin", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        })

        const request = await GET(
            new Request("https://example.com/auth/signIn/oauth-provider", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
            })
        )
        const headers = new Headers(request.headers)
        const location = headers.get("Location")!
        const state = getSetCookie(request, "__Secure-aura-auth.state")!
        expect(location).toMatch(
            new URLSearchParams({
                response_type: "code",
                client_id: "oauth_client_id",
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
                state,
            }).toString()
        )
    })

    test("rejects proxy-derived origin when it is not trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        })

        const request = await GET(
            new Request("https://example.com/auth/signIn/oauth-provider", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "app.com",
                },
            })
        )
        expect(await request.json()).toEqual({
            type: "AUTH_INTERNAL_ERROR",
            message: "The constructed origin URL is not trusted.",
        })
    })

    test("builds redirect URL even with empty trustedOrigins", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedOrigins: [],
        })

        const request = await GET(
            new Request("https://example.com/auth/signIn/oauth-provider", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "app.com",
                },
            })
        )
        const headers = new Headers(request.headers)
        const location = headers.get("Location")!
        const state = getSetCookie(request, "__Secure-aura-auth.state")!
        expect(location).toMatch(
            new URLSearchParams({
                response_type: "code",
                client_id: "oauth_client_id",
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
                state,
            }).toString()
        )
    })

    test("builds redirect URL from trusted proxy headers when origin is trusted", async () => {
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
            trustedOrigins: ["https://app.com"],
        })

        const request = await GET(
            new Request("https://example.com/auth/signIn/oauth-provider", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "app.com",
                },
            })
        )
        const headers = new Headers(request.headers)
        const location = headers.get("Location")!
        const state = getSetCookie(request, "__Secure-aura-auth.state")!
        expect(location).toMatch(
            new URLSearchParams({
                response_type: "code",
                client_id: "oauth_client_id",
                redirect_uri: "https://app.com/auth/callback/oauth-provider",
                state,
            }).toString()
        )
    })
})
