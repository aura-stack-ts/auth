import { describe, test, expect, vi, beforeEach } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { oauthCustomService, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("trustedProxyHeaders", () => {
    describe("valid cases", () => {
        const testCases: {
            title: string
            trustedProxyHeaders: any[]
            trustedOrigins: string[]
            headers: Record<string, string>
        }[] = [
            {
                title: "trustedProxyHeaders with built-in 'forwarded' url source",
                trustedProxyHeaders: [{ url: "forwarded" }],
                trustedOrigins: ["https://example.com"],
                headers: {
                    Forwarded: "host=example.com;proto=https",
                },
            },
            {
                title: "trustedProxyHeaders with custom url source",
                trustedProxyHeaders: [{ url: "x-custom-header" }],
                trustedOrigins: ["https://example.com"],
                headers: {
                    "X-Custom-Header": "https://example.com",
                },
            },
            {
                title: "trustedProxyHeaders with built-in 'forwarded.host' and 'forwarded.proto' url source",
                trustedProxyHeaders: [{ protocol: "forwarded.proto", host: "forwarded.host" }],
                trustedOrigins: ["https://example.com"],
                headers: {
                    Forwarded: "host=example.com;proto=https",
                },
            },
            {
                title: "trustedProxyHeaders with built-in 'x-forwarded-host' and 'x-forwarded-proto' url source",
                trustedProxyHeaders: [{ protocol: "x-forwarded-proto", host: "x-forwarded-host" }],
                trustedOrigins: ["https://example.com"],
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
            },
        ]

        for (const { title, trustedProxyHeaders, trustedOrigins, headers } of testCases) {
            test.concurrent(title, async ({ expect }) => {
                const auth = createAuth({
                    oauth: [oauthCustomService],
                    trustedProxyHeaders,
                    trustedOrigins,
                    credentials: {
                        authorize: () => {
                            return {
                                sub: "1234567890",
                                ...sessionPayload,
                            }
                        },
                    },
                })
                const sessionToken = await auth.jose.encodeJWT(sessionPayload)
                const csrfToken = await createCSRF(auth.jose)
                const output = await auth.api.signInCredentials({
                    payload: { username: "testuser", password: "testpassword" },
                    headers: {
                        ...headers,
                        Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
                expect(output).toEqual({
                    success: true,
                    redirect: false,
                    redirectURL: null,
                    headers: expect.any(Headers),
                    toResponse: expect.any(Function),
                })
            })
        }

        test("trustedProxyHeaders with built-in 'forwarded' url source and multiple trusted origins", async ({ expect }) => {
            const auth = createAuth({
                oauth: [oauthCustomService],
                trustedProxyHeaders: [{ url: "forwarded" }],
                trustedOrigins: ["https://example.com", "https://another-example.com"],
                credentials: {
                    authorize: () => {
                        return {
                            sub: "1234567890",
                            ...sessionPayload,
                        }
                    },
                },
            })
            const sessionToken = await auth.jose.encodeJWT(sessionPayload)
            const csrfToken = await createCSRF(auth.jose)
            const output = await auth.api.signInCredentials({
                payload: { username: "testuser", password: "testpassword" },
                headers: {
                    Forwarded: "host=example.com;proto=https",
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
            expect(output).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
                headers: expect.any(Headers),
                toResponse: expect.any(Function),
            })
        })
    })

    describe("invalid cases", () => {
        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is not set", () => {
            expect(() =>
                createAuth({
                    oauth: [],
                    trustedProxyHeaders: true,
                    trustedOrigins: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("does not throw error if trustedProxyHeaders is enabled and trustedOrigins is set", () => {
            expect(() =>
                createAuth({
                    oauth: [],
                    trustedProxyHeaders: true,
                    trustedOrigins: ["https://example.com"],
                })
            ).not.toThrow()
        })

        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is not set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is empty set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")
            vi.stubEnv("TRUSTED_ORIGINS", "")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("does not throw error if trustedProxyHeaders is enabled and trustedOrigins is set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")
            vi.stubEnv("TRUSTED_ORIGINS", "https://example.com")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).not.toThrow()
        })
    })
})
