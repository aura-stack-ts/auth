import { describe, expect, test } from "vitest"
import { createAuthorizationURL, createRedirectTo, createRedirectURI } from "@/actions/signIn/authorization.js"

describe("createRedirectURI", () => {
    const testCases = [
        {
            description: "creates redirect URI from standard URL",
            requestURL: "https://example.com/signIn/github",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with port",
            requestURL: "http://localhost:3000/signIn/google",
            oauth: "google",
            expected: "http://localhost:3000/auth/callback/google",
        },
        {
            description: "creates redirect URI from URL with path and query",
            requestURL: "https://example.com/signIn/github?query=123",
            oauth: "facebook",
            expected: "https://example.com/auth/callback/facebook",
        },
        {
            description: "creates redirect URI from URL with trailing slash",
            requestURL: "https://example.com/signIn/github/",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with undefined query",
            requestURL: "https://example.com/signIn/github?",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with hash",
            requestURL: "https://example.com/signIn/twitter#section",
            oauth: "twitter",
            expected: "https://example.com/auth/callback/twitter",
        },
        {
            description: "creates redirect URI from URL with subdomain",
            requestURL: "https://subdomain.example.com/signIn/linkedin",
            oauth: "linkedin",
            expected: "https://subdomain.example.com/auth/callback/linkedin",
        },
        {
            description: "creates redirect URI from URL with IP address",
            requestURL: "http://192.168.1.1/signIn/github",
            oauth: "github",
            expected: "http://192.168.1.1/auth/callback/github",
        },
    ]

    for (const { description, requestURL, oauth, expected } of testCases) {
        test(description, () => {
            const redirectURI = createRedirectURI(requestURL, oauth)
            expect(redirectURI).toBe(expected)
        })
    }
})

describe("createAuthorizationURL", () => {
    describe("valid OAuth configuration", () => {
        test("valid OAuth configuration with all fields", () => {
            const url = createAuthorizationURL(
                {
                    id: "oauth-integration",
                    name: "OAuth Integration",
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientId: "1",
                    clientSecret: "2",
                },
                "https://example.com/auth/callback",
                "123",
                "challenge",
                "S256"
            )

            const searchParams = new URL(url).searchParams
            expect(searchParams.get("client_id")).toBe("1")
            expect(searchParams.has("client_secret")).toBeFalsy()
            expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback")
            expect(searchParams.get("state")).toBe("123")
            expect(searchParams.get("scope")).toBe("read:user")
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
                expected: /Invalid OAuth configuration/,
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
                expected: /Invalid OAuth configuration/,
            },
        ]

        for (const { description, oauthConfig, redirectURL, expected } of testCases) {
            test(description, () => {
                expect(() => createAuthorizationURL(oauthConfig as any, redirectURL, "123", "challenge", "S256")).toThrow(
                    expected
                )
            })
        }
    })
})

describe("createRedirectTo", () => {
    describe("valid origin", () => {
        const testCases = [
            {
                description: "returns '/' when Referer header is missing",
                request: new Request("https://example.com/auth/signIn/github"),
                expected: "/",
            },
            {
                description: "returns pathname when origins match",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth" },
                }),
                expected: "/auth",
            },
            {
                description: "returns pathname with trailing slash when origins match",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth/" },
                }),
                expected: "/auth/",
            },

            {
                description: "pathname contains multiple consecutive slashes",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com//auth///dashboard" },
                }),
                expected: "/auth/dashboard",
            },
            {
                description: "pathname contains invalid segments (parent directory)",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/../admin" },
                }),
                expected: "/admin",
            },
            {
                description: "pathname is root '/'",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com" },
                }),
                expected: "/",
            },
            {
                description: "with jump lines in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth/\r\n" },
                }),
                expected: "/auth/",
            },
            {
                description: "with localhost in Referer header",
                request: new Request("http://localhost:3000/auth/signIn/github", {
                    headers: { Referer: "http://localhost:3000/dashboard" },
                }),
                expected: "/dashboard",
            },
            {
                description: "with underscores in Referer header",
                request: new Request("https://example_name.com/auth/signIn/github", {
                    headers: { Referer: "https://example_name.com/auth" },
                }),
                expected: "/auth",
            },
            {
                description: "with complex path in Referer header",
                request: new Request("https://example_name.com/auth/signIn/github", {
                    headers: { Referer: "https://example_name.com/dashboard/admin/panel" },
                }),
                expected: "/dashboard/admin/panel",
            },
        ]

        for (const { description, request, expected } of testCases) {
            test(description, () => {
                const redirectTo = createRedirectTo(request)
                expect(redirectTo).toBe(expected)
            })
        }
    })

    describe("invalid origin", () => {
        const testCases = [
            {
                description: "different origins do not match",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://malicious.com/phishing" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "different protocols do not match",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "http://www.example.com/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "different subdomains do not match",
                request: new Request("https://example.com/auth/signIn/google", {
                    headers: { Referer: "https://sub.example.com/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "different ports do not match",
                request: new Request("http://localhost:3000/auth/signIn/google", {
                    headers: { Referer: "http://localhost:4000/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "missing www in hosted URL",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "https://example.com/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },

            {
                description: "invalid Referer URL (plain text)",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "not-a-valid-url" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid protocol in Referer URL (unsupported protocol)",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "ftp://example.com/resource" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "encoded double slash in Referer path",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://%2f%2fexample.com" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "encoded double slash in Referer path",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://%2f%2fevil.com" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid custom protocol in Referer URL",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "invalid://url" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid path traversal using encoded segments",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth/%2e%2e/%2e%2e/admin" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid path traversal using slashes",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://%2F%2Fexample.com" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid Referer with spaces",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth path" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "invalid path traversal using encoded dots",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/%2e%2e/%2e%2e/" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "pathname contains invalid segments with backslashes",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/..\\admin" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "javascript URL injection in Referer query",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "https://www.example.com?redirectURL=javascript:alert(1)" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "javascript URL injection in Referer",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "javascript:alert(1)" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
            {
                description: "with port in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com:3000" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "with IP address in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://192.168.1.1/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "with subdomain in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://subdomain.example.com/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "with .app domain in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.app/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "with .dev domain in Referer header",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.dev/auth" },
                }),
                expected: /The origin of the request does not match the hosted origin./,
            },
            {
                description: "returns pathname with query when origins match",
                request: new Request("https://example.com/auth/signIn/github", {
                    headers: { Referer: "https://example.com/auth?next=123" },
                }),
                expected: /Invalid origin \(potential CSRF\)./,
            },
        ]

        for (const { description, request, expected } of testCases) {
            test(description, () => {
                expect(() => createRedirectTo(request)).toThrow(expected)
            })
        }
    })
})
