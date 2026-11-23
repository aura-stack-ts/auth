import { describe, test, expect, vi } from "vitest"
import { getUseSecureCookiesConfig } from "@/config/get-use-secure-cookies.ts"

describe("getUseSecureCookiesConfig", () => {
    const testCases = [
        {
            description: "enables secure cookies when explicitly configured",
            baseURL: "",
            useSecureCookies: true,
            expected: "trusted",
        },
        {
            description: "disables secure cookies when explicitly configured",
            baseURL: "",
            useSecureCookies: false,
            expected: "untrusted",
        },
        {
            description: "uses untrusted cookies for an HTTP base URL",
            baseURL: "http://localhost:3000",
            useSecureCookies: undefined,
            expected: "untrusted",
        },
        {
            description: "uses trusted cookies for an HTTPS base URL",
            baseURL: "https://app.com",
            useSecureCookies: undefined,
            expected: "trusted",
        },
    ]

    for (const { description, baseURL, useSecureCookies, expected } of testCases) {
        test(description, () => {
            expect(getUseSecureCookiesConfig({ baseURL, config: { cookies: { useSecureCookies } }, proxyHeaders: false })).toBe(
                expected
            )
        })
    }

    test("defaults to untrusted cookies in development without a base URL", () => {
        vi.stubEnv("NODE_ENV", "development")
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {}, proxyHeaders: false })).toBe("untrusted")
    })

    test("defaults to untrusted cookies in the test environment without a base URL", () => {
        vi.stubEnv("NODE_ENV", "test")
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {}, proxyHeaders: false })).toBe("untrusted")
    })

    test("defaults to trusted cookies in production without a base URL", () => {
        vi.stubEnv("NODE_ENV", "production")
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {}, proxyHeaders: false })).toBe("trusted")
    })

    test("selects cookie security dynamically when proxy headers are trusted", () => {
        expect(
            getUseSecureCookiesConfig({
                baseURL: undefined,
                config: { trustedProxyHeaders: true, trustedOrigins: [] },
                proxyHeaders: true,
            })
        ).toBe("dynamic")
    })
})
