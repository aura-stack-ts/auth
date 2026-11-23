import { describe, test, expect, vi } from "vitest"
import { getUseSecureCookiesConfig } from "@/config/get-use-secure-cookies.ts"

describe("getUseSecureCookiesConfig", () => {
    const testCases = [
        {
            description: "",
            baseURL: "",
            useSecureCookies: true,
            expected: "trusted",
        },
        {
            description: "",
            baseURL: "",
            useSecureCookies: false,
            expected: "untrusted",
        },
        {
            description: "",
            baseURL: "http://localhost:3000",
            useSecureCookies: undefined,
            expected: "untrusted",
        },
        {
            description: "",
            baseURL: "https://app.com",
            useSecureCookies: undefined,
            expected: "trusted",
        },
    ]

    for (const { description, baseURL, useSecureCookies, expected } of testCases) {
        test(description, () => {
            expect(getUseSecureCookiesConfig({ baseURL, config: { cookies: { useSecureCookies } } })).toBe(expected)
        })
    }

    test("", () => {
        vi.stubEnv("NODE_ENV", "development")
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {} })).toBe("untrusted")
    })

    test("", () => {
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {} })).toBe("untrusted")
    })

    test("", () => {
        vi.stubEnv("NODE_ENV", "production")
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: {} })).toBe("trusted")
    })

    test("", () => {
        expect(getUseSecureCookiesConfig({ baseURL: undefined, config: { trustedProxyHeaders: true, trustedOrigins: [] } })).toBe(
            "dynamic"
        )
    })
})
