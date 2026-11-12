import { describe, test, expect, vi } from "vitest"
import { getTrustedOriginsConfig } from "@/config/get-trusted-origins.ts"
import type { AuthConfig } from "@/index.ts"

describe("getTrustedOriginsConfig", () => {
    test("load trusted origins from trustedOrigins option", () => {
        expect(
            getTrustedOriginsConfig(
                {
                    trustedOrigins: ["https://app.com"],
                },
                false
            )
        ).toEqual(["https://app.com"])
    })

    test("load multiple trusted origins from trustedOrigins option", () => {
        expect(
            getTrustedOriginsConfig(
                {
                    trustedOrigins: ["https://app.com", "https://auth.app.com", "https://admin.app.com", "https://net.app.com"],
                },
                false
            )
        ).toEqual(["https://app.com", "https://auth.app.com", "https://admin.app.com", "https://net.app.com"])
    })

    test("load trusted origins from env", () => {
        vi.stubEnv("TRUSTED_ORIGINS", "https://app.com")
        expect(getTrustedOriginsConfig({}, false)).toEqual(["https://app.com"])
    })

    test("load multiple trusted origins from env", () => {
        vi.stubEnv("TRUSTED_ORIGINS", "https://app.com, https://auth.app.com, https://admin.app.com, https://net.app.com")
        expect(getTrustedOriginsConfig({}, false)).toEqual([
            "https://app.com",
            "https://auth.app.com",
            "https://admin.app.com",
            "https://net.app.com",
        ])
    })

    test("load multiple trusted origins from env with (;) separator", () => {
        vi.stubEnv("TRUSTED_ORIGINS", "https://app.com; https://auth.app.com; https://admin.app.com; https://net.app.com")
        expect(getTrustedOriginsConfig({}, false)).toEqual([
            "https://app.com",
            "https://auth.app.com",
            "https://admin.app.com",
            "https://net.app.com",
        ])
    })

    test("throw an error when trusted origins are not set and trustedProxyHeaders is enabled", () => {
        expect(() =>
            getTrustedOriginsConfig(
                {
                    trustedProxyHeaders: true,
                } as AuthConfig,
                true
            )
        ).toThrow()
    })

    test("throw an error when trustedOrigins is empty and trustedProxyHeaders is enabled", () => {
        expect(() =>
            getTrustedOriginsConfig(
                {
                    trustedProxyHeaders: true,
                    trustedOrigins: [],
                },
                true
            )
        ).toThrow()
    })

    test("success config when trustedproxyHeaders is enabled", () => {
        expect(
            getTrustedOriginsConfig(
                {
                    trustedProxyHeaders: true,
                    trustedOrigins: ["https://app.com"],
                },
                true
            )
        ).toEqual(["https://app.com"])
    })
})
