import { describe, test, expect, vi } from "vitest"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { createContext } from "@/config/context.ts"
import { builtInOAuthProviders } from "@/oauth/index.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"

describe("createValidation", () => {
    describe("verifyOAuthProvider", () => {
        test("resolves a configured built-in OAuth provider", async () => {
            const ctx = createContext({ oauth: ["github"] })
            expect(await createValidation(ctx).verifyOAuthProvider("github").execute()).toEqual({
                provider: {
                    ...builtInOAuthProviders.github(),
                    clientId: "github-client-id",
                    clientSecret: "github-client-secret",
                    profile: expect.any(Function),
                },
            })
        })

        test("rejects an OAuth provider that is not configured", async () => {
            const ctx = createContext({ oauth: [] })
            await expect(createValidation(ctx).verifyOAuthProvider("github").execute()).rejects.toThrow(
                new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
            )
        })
    })

    describe("buildRequest", () => {
        test("builds a request using the incoming request origin by default", async () => {
            const ctx = createContext({})
            const request = new Request("https://example.com")
            expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                expect.objectContaining({
                    request: new Request("https://example.com/path"),
                    origin: "https://example.com",
                })
            )
        })

        test("rejects an incoming request origin that is not trusted", async () => {
            const ctx = createContext({ baseURL: "https://appdomain.com" })
            const request = new Request("https://example.com")
            await expect(createValidation(ctx, request).buildRequest("/path").execute()).rejects.toThrow(
                new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN" })
            )
        })

        test("accepts trusted HTTPS forwarded headers", async () => {
            const ctx = createContext({ trustedProxyHeaders: true, trustedOrigins: ["https://example.com"] })
            const request = new Request("https://example.com", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
            })
            expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                expect.objectContaining({
                    request: new Request("https://example.com/path"),
                    origin: "https://example.com",
                })
            )
        })

        test("rejects forwarded headers that resolve to an untrusted origin", async () => {
            const ctx = createContext({ trustedProxyHeaders: true, trustedOrigins: ["https://example.com"] })
            const request = new Request("https://example.com", {
                headers: {
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "10.0.0.98:8889",
                },
            })
            await expect(createValidation(ctx, request).buildRequest("/path").execute()).rejects.toThrow(
                new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN" })
            )
        })

        test("builds a request from a trusted forwarded HTTP origin", async () => {
            const ctx = createContext({ trustedProxyHeaders: true, trustedOrigins: ["http://10.0.0.98:8888"] })
            const request = new Request("https://example.com", {
                headers: {
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "10.0.0.98:8888",
                },
            })
            expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                expect.objectContaining({
                    request: new Request("http://10.0.0.98:8888/path"),
                    origin: "http://10.0.0.98:8888",
                })
            )
        })

        test("uses a trusted forwarded host when it differs from the request host", async () => {
            const ctx = createContext({ trustedProxyHeaders: true, trustedOrigins: ["http://10.0.0.98:8888"] })
            const request = new Request("http://191.1.2.3:2222", {
                headers: {
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "10.0.0.98:8888",
                },
            })
            expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                expect.objectContaining({
                    request: new Request("http://10.0.0.98:8888/path"),
                    origin: "http://10.0.0.98:8888",
                })
            )
        })

        test("uses trusted forwarded HTTPS headers instead of the request origin", async () => {
            const ctx = createContext({ trustedProxyHeaders: true, trustedOrigins: ["https://example.com"] })
            const request = new Request("http://191.1.2.3:2222", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
            })
            expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                expect.objectContaining({
                    request: new Request("https://example.com/path"),
                    origin: "https://example.com",
                })
            )
        })

        describe("build request", () => {
            const ctx = createContext({
                trustedProxyHeaders: true,
                trustedOrigins: ["https://app.com", "http://10.0.0.1:8888", "http://152.1.2.3:2222"],
            })
            test("accepts a forwarded HTTPS origin listed in trusted origins", async () => {
                const request = new Request("http://191.1.2.3:2222", {
                    headers: {
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "app.com",
                    },
                })
                expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                    expect.objectContaining({
                        request: new Request("https://app.com/path"),
                        origin: "https://app.com",
                    })
                )
            })

            test("rejects a forwarded origin that is not listed in trusted origins", async () => {
                const request = new Request("http://191.1.2.3:2222", {
                    headers: {
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "example.com",
                    },
                })
                await expect(createValidation(ctx, request).buildRequest("/path").execute()).rejects.toThrow(
                    new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN" })
                )
            })

            test("accepts a trusted forwarded IPv4 origin", async () => {
                const request = new Request("http://191.1.2.3:2222", {
                    headers: {
                        "X-Forwarded-Proto": "http",
                        "X-Forwarded-Host": "10.0.0.1:8888",
                    },
                })
                expect(await createValidation(ctx, request).buildRequest("/path").execute()).toEqual(
                    expect.objectContaining({
                        request: new Request("http://10.0.0.1:8888/path"),
                        origin: "http://10.0.0.1:8888",
                    })
                )
            })

            test("accepts a second trusted forwarded IPv4 origin", async () => {
                const request = new Request("http://191.1.2.3:2222", {
                    headers: {
                        "X-Forwarded-Proto": "http",
                        "X-Forwarded-Host": "152.1.2.3:2222",
                    },
                })
                const output = await createValidation(ctx, request).buildRequest("/path").execute()
                expect(output.origin).toBe("http://152.1.2.3:2222")
                expect(output.request).toEqual(new Request("http://152.1.2.3:2222/path"))
            })
        })

        describe("useSecureCookies", () => {
            test("useSecureCookies in development env (secure by default)", async () => {
                vi.stubEnv("NODE_ENV", "development")
                const ctx = createContext({})
                expect(ctx.cookies.store.sessionToken).toEqual({
                    name: "aura-auth.session_token",
                    attributes: {
                        httpOnly: true,
                        secure: false,
                        path: "/",
                        maxAge: expect.any(Number),
                        sameSite: "lax",
                    },
                })
            })

            test("useSecureCookies in production env (secure by default)", async () => {
                vi.stubEnv("NODE_ENV", "production")
                const ctx = createContext({})
                expect(ctx.cookies.store.sessionToken).toEqual({
                    name: "__Secure-aura-auth.session_token",
                    attributes: {
                        httpOnly: true,
                        secure: true,
                        path: "/",
                        maxAge: expect.any(Number),
                        sameSite: "lax",
                    },
                })
            })

            test("useSecureCookies: false", async () => {
                const ctx = createContext({ cookies: { useSecureCookies: false } })
                expect(ctx.cookies.store.sessionToken).toEqual({
                    name: "aura-auth.session_token",
                    attributes: {
                        httpOnly: true,
                        secure: false,
                        path: "/",
                        maxAge: expect.any(Number),
                        sameSite: "lax",
                    },
                })
            })

            test("useSecureCookies: true", async () => {
                const ctx = createContext({ cookies: { useSecureCookies: true } })
                expect(ctx.cookies.store.sessionToken).toEqual({
                    name: "__Secure-aura-auth.session_token",
                    attributes: {
                        httpOnly: true,
                        secure: true,
                        path: "/",
                        maxAge: expect.any(Number),
                        sameSite: "lax",
                    },
                })
            })

            describe("useSecureCookies dynamically", () => {
                const ctx = createContext({
                    trustedProxyHeaders: true,
                    trustedOrigins: ["https://app.com", "http://192.1.2.3:4444"],
                })

                test("uses secure session cookies for a trusted forwarded HTTPS origin", async () => {
                    const request = new Request("https://example.com", {
                        headers: {
                            "X-Forwarded-Proto": "https",
                            "X-Forwarded-Host": "app.com",
                        },
                    })
                    const { cookieStore } = await createValidation(ctx, request).buildRequest("/path").execute()

                    expect(cookieStore.sessionToken).toEqual({
                        name: "__Secure-aura-auth.session_token",
                        attributes: {
                            httpOnly: true,
                            secure: true,
                            path: "/",
                            maxAge: expect.any(Number),
                            sameSite: "lax",
                        },
                    })
                })

                test("uses non-secure session cookies for a trusted forwarded HTTP origin", async () => {
                    const request = new Request("http://192.1.1.1:8888", {
                        headers: {
                            "X-Forwarded-Proto": "http",
                            "X-Forwarded-Host": "192.1.2.3:4444",
                        },
                    })
                    const { cookieStore } = await createValidation(ctx, request).buildRequest("/path").execute()

                    expect(cookieStore.sessionToken).toEqual({
                        name: "aura-auth.session_token",
                        attributes: {
                            httpOnly: true,
                            secure: false,
                            path: "/",
                            maxAge: expect.any(Number),
                            sameSite: "lax",
                        },
                    })
                })
            })
        })
    })
})
