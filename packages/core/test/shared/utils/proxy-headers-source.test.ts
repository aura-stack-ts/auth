import { describe, expect, test } from "vitest"
import { getBaseURLFromProxyHeaders } from "@/shared/utils/proxy-headers-source.ts"
import type { TrustedProxyHeadersSource } from "@/@types/config.ts"

describe("getBaseURLFromProxyHeaders", () => {
    describe("valid proxy headers", () => {
        const testCases: { description: string; headers: HeadersInit; trustedProxyHeaders: TrustedProxyHeadersSource[] }[] = [
            {
                description: "with x-forwarded-proto and x-forwarded-host headers",
                headers: { Forwarded: "proto=https;host=example.com" },
                trustedProxyHeaders: [{ url: "forwarded" }],
            },
            {
                description: "with forwarded.proto and forwarded.host headers",
                headers: { Forwarded: "proto=https;host=example.com" },
                trustedProxyHeaders: [{ protocol: "forwarded.proto", host: "forwarded.host" }],
            },
            {
                description: "with x-forwarded-proto and x-forwarded-host headers",
                headers: {
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
                trustedProxyHeaders: [{ protocol: "x-forwarded-proto", host: "x-forwarded-host" }],
            },
            {
                description: "with custom url source headers",
                headers: { "X-Custom-Url": "https://example.com" },
                trustedProxyHeaders: [{ url: "x-custom-url" }],
            },
            {
                description: "with custom protocol and host source headers",
                headers: {
                    "X-Custom-Proto": "https",
                    "X-Custom-Host": "example.com",
                },
                trustedProxyHeaders: [{ protocol: "x-custom-proto", host: "x-custom-host" }],
            },
            {
                description: "fallback to valid url source",
                headers: {
                    "x-custom-url": "https:_/example.com",
                    "x-custom-invalid-url": "https://",
                    "x-custom-valid-url": "https://example.com",
                },
                trustedProxyHeaders: [{ url: "x-custom-url" }, { url: "x-custom-invalid-url" }, { url: "x-custom-valid-url" }],
            },
            {
                description: "fallback to valid protocol and host source",
                headers: {
                    "x-custom-invalid-url": "https://",
                    "x-custom-proto": "https",
                    "x-custom-host": "example.com",
                },
                trustedProxyHeaders: [{ url: "x-custom-invalid-url" }, { protocol: "x-custom-proto", host: "x-custom-host" }],
            },
            {
                description: "fallback to valid forwarded source",
                headers: {
                    Forwarded: "",
                    "X-Forwarded-Proto": "https",
                    "X-Forwarded-Host": "example.com",
                },
                trustedProxyHeaders: [{ url: "forwarded" }, { protocol: "x-forwarded-proto", host: "x-forwarded-host" }],
            },
            {
                description: "fallback to custom url source when forwarded and x-forwarded headers are invalid",
                headers: {
                    Forwarded: "proto=http",
                    "X-Custom-Url": "https://example.com",
                },
                trustedProxyHeaders: [{ protocol: "forwarded.proto", host: "forwarded.host" }, { url: "x-custom-url" }],
            },
        ]
        for (const { description, headers, trustedProxyHeaders } of testCases) {
            test(description, () => {
                const baseURL = getBaseURLFromProxyHeaders(new Headers(headers), trustedProxyHeaders)
                expect(baseURL).toBe("https://example.com")
            })
        }
    })

    describe("invalid proxy headers", () => {
        const testCases: { description: string; headers: HeadersInit; trustedProxyHeaders: TrustedProxyHeadersSource[] }[] = [
            {
                description: "empty headers",
                headers: {},
                trustedProxyHeaders: [{ url: "forwarded" }],
            },
            {
                description: "with invalid forwarded header",
                headers: { Forwarded: "" },
                trustedProxyHeaders: [{ url: "forwarded" }],
            },
            {
                description: "with invalid url",
                headers: { "X-Custom-Url": "invalid-url" },
                trustedProxyHeaders: [{ url: "x-custom-url" }],
            },
        ]

        for (const { description, headers, trustedProxyHeaders } of testCases) {
            test(description, () => {
                expect(() => getBaseURLFromProxyHeaders(new Headers(headers), trustedProxyHeaders)).toThrowError(
                    "Initialization aborted: The custom 'trustedProxyHeaders' configuration is insecure or invalid. Allowing arbitrary or untrusted headers to construct the absolute application URL exposes the server to Host Header Injection and request forgery vulnerabilities."
                )
            })
        }
    })
})
