import { beforeEach, describe, expect, test, vi } from "vitest"
import { oauthCustomService } from "@test/setup/presets.ts"
import { createRedirectURI, createAuthorizationURL } from "@/shared/oauth2/authorization-url.ts"
import type { GlobalContext } from "@aura-stack/router/types"
import type { RouterGlobalContext } from "@/@types/internal.ts"
import type { OAuthProviderCredentials } from "@/@types/index.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("createRedirectURI", () => {
    describe("valid request", () => {
        const testCases = [
            {
                description: "creates redirect URI from standard URL",
                request: new Request("https://example.com/signIn/github"),
                oauth: "github",
                expected: "https://example.com/auth/callback/github",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with port",
                request: new Request("http://localhost:3000/signIn/google"),
                oauth: "google",
                expected: "http://localhost:3000/auth/callback/google",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with path and query",
                request: new Request("https://example.com/signIn/github?query=123"),
                oauth: "facebook",
                expected: "https://example.com/auth/callback/facebook",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with trailing slash",
                request: new Request("https://example.com/signIn/github/"),
                oauth: "github",
                expected: "https://example.com/auth/callback/github",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with undefined query",
                request: new Request("https://example.com/signIn/github?"),
                oauth: "github",
                expected: "https://example.com/auth/callback/github",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with hash",
                request: new Request("https://example.com/signIn/twitter#section"),
                oauth: "twitter",
                expected: "https://example.com/auth/callback/twitter",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with subdomain",
                request: new Request("https://subdomain.example.com/signIn/linkedin"),
                oauth: "linkedin",
                expected: "https://subdomain.example.com/auth/callback/linkedin",
                trustedProxyHeaders: false,
            },
            {
                description: "creates redirect URI from URL with IP address",
                request: new Request("http://192.168.1.1/signIn/github"),
                oauth: "github",
                expected: "http://192.168.1.1/auth/callback/github",
                trustedProxyHeaders: false,
            },
        ]

        for (const { description, request, oauth, expected, trustedProxyHeaders } of testCases) {
            test(description, async () => {
                const redirectURI = await createRedirectURI(request, oauth, {
                    basePath: "/auth",
                    trustedProxyHeaders,
                } as any as GlobalContext)
                expect(redirectURI).toBe(expected)
            })
        }
    })

    describe("invalid request", () => {
        const testCases = [
            {
                description: "creates redirect URI from URL with trusted proxy headers",
                request: new Request("http://localhost:3000/signIn/google", {
                    headers: {
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "example.com",
                    },
                }),
                oauth: "google",
                trustedProxyHeaders: true,
            },
        ]

        for (const { description, request, oauth, trustedProxyHeaders } of testCases) {
            test(description, async () => {
                await expect(
                    createRedirectURI(request, oauth, {
                        basePath: "/auth",
                        trustedProxyHeaders,
                    } as any as RouterGlobalContext)
                ).rejects.toThrow(
                    "The request location context was blocked. The incoming value does not match patterns mapped inside your array configuration rules."
                )
            })
        }
    })
})

describe("createAuthorizationURL", () => {
    vi.stubEnv("BASE_URL", undefined)

    describe("valid OAuth configuration", () => {
        test("valid OAuth configuration with all fields", async () => {
            const { authorization } = await createAuthorizationURL(
                oauthCustomService,
                "https://example.com/auth/callback/oauth-provider"
            )

            const searchParams = new URL(authorization).searchParams
            expect(searchParams.has("client_secret")).toBeFalsy()
            expect(searchParams.get("client_id")).toBe("oauth_client_id")
            expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
            expect(searchParams.get("state")).toBeTruthy()
            expect(searchParams.get("scope")).toBe("profile email")
            expect(searchParams.get("response_type")).toBe("code")
        })
    })

    describe("invalid OAuth configuration", () => {
        const testCases = [
            {
                description: "missing clientId",
                oauthConfig: {
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientSecret: "2",
                },
                redirectURL: "https://example.com/auth/callback",
                expected:
                    "The loaded configuration settings array failed standard library schema validation checks against required engine operational footprints.",
            },
            {
                description: "missing clientSecret",
                oauthConfig: {
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientId: "1",
                },
                redirectURL: "https://example.com/auth/callback",
                expected:
                    "The loaded configuration settings array failed standard library schema validation checks against required engine operational footprints.",
            },
        ]

        for (const { description, oauthConfig, redirectURL, expected } of testCases) {
            test(description, async () => {
                await expect(() =>
                    createAuthorizationURL(oauthConfig as unknown as OAuthProviderCredentials, redirectURL, {} as GlobalContext)
                ).rejects.toThrow(expected)
            })
        }
    })
})
