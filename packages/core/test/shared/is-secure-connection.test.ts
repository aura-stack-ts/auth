import { describe, test, expect } from "vitest"
import { isSecureConnection } from "@/shared/http/is-secure-connection.ts"
import type { AuthConfig } from "@/index.ts"

describe("isSecureConnection", () => {
    const testCases: {
        description: string
        request: Request | Headers
        proxyHeaders: AuthConfig["trustedProxyHeaders"]
        expected: boolean
    }[] = [
        {
            description: "treats an HTTPS request as secure when proxy headers are disabled",
            request: new Request("https://app.com"),
            proxyHeaders: false,
            expected: true,
        },
        {
            description: "treats an HTTP request as insecure when proxy headers are disabled",
            request: new Request("http://192.1.1.2:8888"),
            proxyHeaders: false,
            expected: false,
        },
        {
            description: "does not trust the request URL when trusted proxy headers are enabled",
            request: new Request("https://app.com"),
            proxyHeaders: true,
            expected: false,
        },
        {
            description: "treats the connection as insecure when trusted proxy headers are absent",
            request: new Request("http://192.1.1.2:8888"),
            proxyHeaders: true,
            expected: false,
        },
        {
            description: "uses the standard Forwarded header to detect HTTPS behind a trusted proxy",
            request: new Request("https://app.com", { headers: { forwarded: "host=app.com; proto=https" } }),
            proxyHeaders: true,
            expected: true,
        },
        {
            description: "uses the standard Forwarded header to detect HTTP behind a trusted proxy",
            request: new Request("https://app.com", { headers: { forwarded: "host=192.1.1.2:8888; proto=http" } }),
            proxyHeaders: true,
            expected: false,
        },
        {
            description: "uses the configured proxy URL header to detect HTTPS",
            request: new Request("https://app.com", { headers: { "x-custom-url": "https://realapp.com" } }),
            proxyHeaders: [{ url: "x-custom-url" }],
            expected: true,
        },
        {
            description: "uses the configured proxy URL header to detect HTTP",
            request: new Request("https://app.com", { headers: { "x-custom-url": "http://192.1.1.2:8888" } }),
            proxyHeaders: [{ url: "x-custom-url" }],
            expected: false,
        },
    ]

    for (const { description, request, proxyHeaders, expected } of testCases) {
        test(description, () => {
            expect(isSecureConnection(request, proxyHeaders)).toBe(expected)
        })
    }
})
