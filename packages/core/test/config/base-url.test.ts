import { describe, test, expect, vi } from "vitest"
import { getBaseURLConfig, getBaseURL } from "@/config/get-base-url.ts"
import type { RoutePattern } from "@aura-stack/router"
import type { GlobalContext } from "@aura-stack/router/types"

describe("getBaseURLConfig", () => {
    describe("valid baseURL config", () => {
        const testCases = [
            {
                description: "valid baseURL config",
                baseURL: "https://example.com",
                expected: "https://example.com",
            },
            {
                description: "valid baseURL config with trailing slash",
                baseURL: "https://example.com/",
                expected: "https://example.com",
            },
            {
                description: "valid baseURL config with path",
                baseURL: "https://example.com/api/v1",
                expected: "https://example.com",
            },
            {
                description: "valid baseURL config with search params",
                baseURL: "https://example.com/api/v1?param=value",
                expected: "https://example.com",
            },
            {
                description: "valid baseURL config with hash",
                baseURL: "https://example.com/api/v1#section",
                expected: "https://example.com",
            },
            {
                description: "invalid baseURL config with wrong url",
                baseURL: undefined,
                expected: undefined,
            },
        ]

        for (const { description, baseURL, expected } of testCases) {
            test.concurrent(description, () => {
                expect(getBaseURLConfig({ baseURL: baseURL as RoutePattern })).toBe(expected)
            })
        }
    })

    describe("invalid baseURL config", () => {
        const testCases = [
            {
                description: "invalid baseURL config with no protocol",
                baseURL: "example.com",
            },
            {
                description: "invalid baseURL config with invalid domain",
                baseURL: "https://",
            },
        ]

        for (const { description, baseURL } of testCases) {
            test.concurrent(description, () => {
                expect(() => getBaseURLConfig({ baseURL: baseURL as RoutePattern })).toThrow()
            })
        }
    })
})

describe("getBaseURL", () => {
    const testCases = [
        {
            description: "baseURL from request URL",
            request: new Request("https://example.com/auth/signIn/github"),
            trustedProxyHeaders: false,
            expected: "https://example.com",
        },
        {
            description: "baseURL from request URL with trustedProxyHeaders",
            request: new Request("https://example.com/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
            }),
            trustedProxyHeaders: true,
            expected: "https://example.com",
        },
        {
            description: "baseURL from request URL with trusted proxy headers and localhost",
            request: new Request("http://localhost:3000/auth/signIn/github", {
                headers: {
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "localhost:4000",
                },
            }),
            trustedProxyHeaders: true,
            expected: "http://localhost:4000",
        },
        {
            description: "baseURL from request object with trustedProxyHeaders and priority headers",
            request: new Request("https://example.com/auth/signIn/github", {
                headers: {
                    Forwarded: "proto=https;host=example.com",
                    "X-Forwarded-Proto": "http",
                    "X-Forwarded-Host": "malicious.com",
                },
            }),
            trustedProxyHeaders: true,
            expected: "https://example.com",
        },
    ]

    for (const { description, request, trustedProxyHeaders, expected } of testCases) {
        test(description, async () => {
            const baseURL = await getBaseURL({ request, ctx: { trustedProxyHeaders } as GlobalContext })
            expect(baseURL).toBe(expected)
        })
    }

    test("with BASE_URL environment variable", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const baseURL = await getBaseURL({})
        expect(baseURL).toBe("https://example.com")
    })

    test("with baseURL in context", async () => {
        const baseURL = await getBaseURL({ ctx: { baseURL: "https://example.com" } as GlobalContext })
        expect(baseURL).toBe("https://example.com")
    })
})
