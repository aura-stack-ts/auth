import { describe, expect, test } from "vitest"
import { createRedirectTo } from "@/shared/utils/create-redirect-to.ts"
import type { GlobalContext } from "@aura-stack/router/types"

describe("createRedirectTo", () => {
    const signInURL = "https://example.com/auth/signIn/github"

    describe("valid origin", () => {
        const testCases = [
            {
                description: "returns '/' when Referer header is missing",
                request: new Request(signInURL),
                expected: "/",
            },
            {
                description: "returns pathname when origins match",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/auth" },
                }),
                expected: "/auth",
            },
            {
                description: "returns pathname with trailing slash when origins match",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/auth/" },
                }),
                expected: "/auth/",
            },

            {
                description: "pathname contains multiple consecutive slashes",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com//auth///dashboard" },
                }),
                expected: "/",
            },
            {
                description: "pathname contains invalid segments (parent directory)",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/../admin" },
                }),
                expected: "/",
            },
            {
                description: "pathname is root '/' with referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com" },
                }),
                expected: "/",
            },
            {
                description: "with jump lines in Referer header",
                request: new Request(signInURL, {
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
            {
                description: "with origin header matching hosted origin",
                request: new Request(signInURL, {
                    headers: { Origin: "https://example.com" },
                }),
                expected: "/",
            },
            {
                description: "with origin and referer headers matching hosted origin",
                request: new Request(signInURL, {
                    headers: {
                        Origin: "https://example.com",
                        Referer: "https://example.com/some/path",
                    },
                }),
                expected: "/some/path",
            },
            {
                description: "pathname is '/' with origin header",
                request: new Request(signInURL, {
                    headers: { Origin: "https://example.com" },
                }),
                expected: "/",
            },
            {
                description: "with path in origin header",
                request: new Request(signInURL, {
                    headers: { Origin: "https://example.com/dashboard" },
                }),
                expected: "/dashboard",
            },
            {
                description: "with redirectTo parameter provided",
                request: new Request(signInURL),
                redirectTo: "/auth/signIn",
                expected: "/auth/signIn",
            },
            {
                description: "with redirectTo parameter matching hosted origin",
                request: new Request(signInURL),
                redirectTo: "https://example.com/auth/signIn",
                expected: "/auth/signIn",
            },
            {
                description: "with redirectTo parameter overriding referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/dashboard" },
                }),
                redirectTo: "/auth/signIn",
                expected: "/auth/signIn",
            },
            {
                description: "with localhost and without redirectTo parameter",
                request: new Request("http://localhost:3000/auth/signIn/github"),
                redirectTo: "/",
                expected: "/",
            },
            {
                description: "with localhost and referer header",
                request: new Request("http://localhost:3000/auth/signIn/github", {
                    headers: { Referer: "http://localhost:3000/dashboard" },
                }),
                redirectTo: "/dashboard",
                expected: "/dashboard",
            },
            {
                description: "with Ipv4 address and without referer header",
                request: new Request("http://192.168.0.1/auth/signIn/github"),
                redirectTo: "/",
                expected: "/",
            },
            {
                description: "with Ipv4 address and referer header",
                request: new Request("http://192.168.0.1/auth/signIn/github", {
                    headers: { Referer: "http://192.168.0.1/dashboard" },
                }),
                redirectTo: "/dashboard",
                expected: "/dashboard",
            },
            {
                description: "with IPv4 address and referer header",
                request: new Request("https://192.168.0.1/auth/signIn/github", {
                    headers: { Referer: "https://192.168.0.1/dashboard" },
                }),
                redirectTo: "/dashboard",
                expected: "/dashboard",
            },
            {
                description: "with trusted proxy headers enabled",
                request: new Request("http:/localhost:3000/auth/signIn/github", {
                    headers: {
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "http://192.168.0.1",
                    },
                }),
                trustedProxyHeaders: true,
                redirectTo: "/",
                expected: "/",
            },
            {
                description: "with trusted proxy headers disabled",
                request: new Request("http:/localhost:3000/auth/signIn/github", {
                    headers: {
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "http://192.168.0.1",
                    },
                }),
                trustedProxyHeaders: false,
                redirectTo: "/",
                expected: "/",
            },
            {
                description: "with redirectTo parameter containing full URL with query",
                request: new Request(signInURL),
                trustedProxyHeaders: false,
                redirectTo: "https://example.com/auth/signIn?next=123",
                expected: "/auth/signIn?next=123",
            },
        ]

        for (const { description, request, expected, redirectTo: redirectToParam, trustedProxyHeaders } of testCases) {
            test(description, async () => {
                const redirectTo = await createRedirectTo(request, redirectToParam, { trustedProxyHeaders } as GlobalContext)
                expect(redirectTo).toBe(expected)
            })
        }
    })

    describe("invalid origin", () => {
        const testCases = [
            {
                description: "different origins do not match",
                request: new Request(signInURL, {
                    headers: { Referer: "https://malicious.com/phishing" },
                }),
            },
            {
                description: "different protocols do not match",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "http://www.example.com/auth" },
                }),
            },
            {
                description: "different subdomains do not match",
                request: new Request("https://example.com/auth/signIn/google", {
                    headers: { Referer: "https://sub.example.com/auth" },
                }),
            },
            {
                description: "different ports do not match",
                request: new Request("http://localhost:3000/auth/signIn/google", {
                    headers: { Referer: "http://localhost:4000/auth" },
                }),
            },
            {
                description: "missing www in hosted URL",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "https://example.com/auth" },
                }),
            },

            {
                description: "invalid Referer URL (plain text)",
                request: new Request(signInURL, {
                    headers: { Referer: "not-a-valid-url" },
                }),
            },
            {
                description: "invalid protocol in Referer URL (unsupported protocol)",
                request: new Request(signInURL, {
                    headers: { Referer: "ftp://example.com/resource" },
                }),
            },
            {
                description: "encoded double slash in Referer path",
                request: new Request(signInURL, {
                    headers: { Referer: "https://%2f%2fexample.com" },
                }),
            },
            {
                description: "encoded double slash in Referer path",
                request: new Request(signInURL, {
                    headers: { Referer: "https://%2f%2fevil.com" },
                }),
            },
            {
                description: "invalid custom protocol in Referer URL",
                request: new Request(signInURL, {
                    headers: { Referer: "invalid://url" },
                }),
            },
            {
                description: "invalid path traversal using encoded segments",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/auth/%2e%2e/%2e%2e/admin" },
                }),
            },
            {
                description: "invalid path traversal using slashes",
                request: new Request(signInURL, {
                    headers: { Referer: "https://%2F%2Fexample.com" },
                }),
            },
            {
                description: "invalid Referer with spaces",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/auth path" },
                }),
            },
            {
                description: "invalid path traversal using encoded dots",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/%2e%2e/%2e%2e/" },
                }),
            },
            {
                description: "pathname contains invalid segments with backslashes",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com/..\\admin" },
                }),
            },
            {
                description: "javascript URL injection in Referer query",
                request: new Request("https://www.example.com/auth/signIn/google", {
                    headers: { Referer: "https://www.example.com?redirectURL=javascript:alert(1)" },
                }),
            },
            {
                description: "javascript URL injection in Referer",
                request: new Request(signInURL, {
                    headers: { Referer: "javascript:alert(1)" },
                }),
            },
            {
                description: "with port in Referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.com:3000" },
                }),
            },
            {
                description: "with IP address in Referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://192.168.1.1/auth" },
                }),
            },
            {
                description: "with subdomain in Referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://subdomain.example.com/auth" },
                }),
            },
            {
                description: "with .app domain in Referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.app/auth" },
                }),
            },
            {
                description: "with .dev domain in Referer header",
                request: new Request(signInURL, {
                    headers: { Referer: "https://example.dev/auth" },
                }),
            },
            {
                description: "with redirectTo parameter containing full URL with different origin",
                request: new Request(signInURL),
                redirectTo: "https://malicious.com/auth/signIn",
            },
            {
                description: "with redirectTo parameter containing invalid URL",
                request: new Request(signInURL),
                redirectTo: "ht!tp://invalid-url",
            },
            {
                description: "when redirectTo is not valid urlqq",
                request: new Request(signInURL),
                redirectTo: "https://app.com:99999/dashboard",
            },
        ]

        for (const { description, request, redirectTo } of testCases) {
            test(description, async () => {
                expect(await createRedirectTo(request, redirectTo)).toEqual("/")
            })
        }
    })

    describe("with trustedOrigins config", () => {
        test("accepts referer from trusted origin", async () => {
            const request = new Request("https://example.com/auth/signIn/github", {
                headers: { Referer: "https://example.com/dashboard" },
            })
            const redirectTo = await createRedirectTo(request, undefined, {
                trustedOrigins: ["https://example.com", "https://admin.example.com"],
            } as GlobalContext)
            expect(redirectTo).toBe("/dashboard")
        })

        test("accepts referer matching wildcard pattern", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github", {
                headers: { Referer: "https://app.example.com/dashboard" },
            })
            const redirectTo = await createRedirectTo(request, undefined, {
                trustedOrigins: ["https://*.example.com"],
            } as GlobalContext)
            expect(redirectTo).toBe("/dashboard")
        })

        test("rejects referer not in trusted origins", async () => {
            const request = new Request("https://example.com/auth/signIn/github", {
                headers: { Referer: "https://malicious.com/phishing" },
            })
            const redirectTo = await createRedirectTo(request, undefined, {
                trustedOrigins: ["https://example.com"],
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })

        test("accepts redirectTo from trusted origin", async () => {
            const request = new Request("https://example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://example.com/dashboard", {} as GlobalContext)
            expect(redirectTo).toBe("/dashboard")
        })

        test("with trusted origins that are not same origin", async () => {
            const request = new Request("https://example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://api.example.com/redirect", {
                trustedOrigins: ["https://api.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })

        test("accepts a trusted redirect from a different origin", async () => {
            const request = new Request("https://example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://api.example.com/redirect", {
                trustedOrigins: ["https://example.com", "https://api.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("https://api.example.com/redirect")
        })

        test("misconfigurated", async () => {
            const request = new Request("https://example.com/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://api.example.com/redirect", {
                trustedOrigins: ["https://example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })

        test("with wildcard pattern and subdomain and valid origin", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://app.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("/dashboard")
        })

        test("with wildcard pattern and subdomain with invalid redirect value", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://malicious.com/phishing", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })

        test("with wildcard pattern and subdomain with different subdomain", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github")
            const redirectTo3 = await createRedirectTo(request, "https://sub.app.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo3).toBe("/")
        })

        test("with wildcard pattern and subdomain with multiple subdomains", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github")
            const redirectTo = await createRedirectTo(request, "https://evil.app.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: false,
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })

        test("with wildcard pattern with multiple subdomains", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "evil.app.example.com",
                },
            })
            const redirectTo = await createRedirectTo(request, "https://evil.app.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: true,
            } as GlobalContext)
            expect(redirectTo).toBe("/")
        })
    })

    describe("SECURITY", () => {
        // This test demonstrates a potential security risk if trustedProxyHeaders is enabled in an
        // insecure environment. It shows that if an attacker can control the X-Forwarded-Host header,
        // they could potentially bypass the trusted origins check and redirect users to a malicious site.
        test("with wildcard pattern with dangerous origin from trustedProxyHeaders", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "evil.example.com",
                },
            })
            const redirectTo = await createRedirectTo(request, "https://evil.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: true,
            } as GlobalContext)
            expect(redirectTo).toBe("/dashboard")
        })

        test("with wildcard pattern with dangerous origin from trustedProxyHeaders when origins are not the same", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "superdevil.example.com",
                },
            })
            const redirectTo = await createRedirectTo(request, "https://evil.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: true,
            } as GlobalContext)
            expect(redirectTo).toBe("https://evil.example.com/dashboard")
        })

        test("with wildcard pattern with trustedProxyHeaders", async () => {
            const request = new Request("https://app.example.com/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "app.example.com",
                },
            })
            const redirectTo = await createRedirectTo(request, "https://evil.example.com/dashboard", {
                trustedOrigins: ["https://*.example.com"],
                trustedProxyHeaders: true,
            } as GlobalContext)
            expect(redirectTo).toBe("https://evil.example.com/dashboard")
        })
    })
})
