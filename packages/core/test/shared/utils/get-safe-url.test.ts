import { describe, test, expect } from "vitest"
import { getSafeURL } from "@/shared/utils/get-safe-url.ts"

describe("getSafeURL", () => {
    const testCases = [
        {
            description: "returns relative URLs unchanged",
            baseURL: "https://app.com",
            url: "/dashboard",
            trustedOrigins: [],
            expected: "/dashboard",
        },
        {
            description: "converts a same-origin absolute URL to a relative path",
            baseURL: "https://app.com",
            url: "https://app.com/dashboard",
            trustedOrigins: [],
            expected: "/dashboard",
        },
        {
            description: "allows an absolute URL from a trusted origin",
            baseURL: "https://app.com",
            url: "https://subapp.com/dashboard",
            trustedOrigins: ["https://app.com", "https://subapp.com"],
            expected: "https://subapp.com/dashboard",
        },
        {
            description: "rejects an absolute URL from an untrusted origin",
            baseURL: "https://app.com",
            url: "https://devil.com/dashboard",
            trustedOrigins: [],
            expected: null,
        },
        {
            description: "rejects a private IP URL when the base URL is public",
            baseURL: "https://app.com",
            url: "http://10.0.0.1:5858/dashboard",
            trustedOrigins: [],
            expected: null,
        },
        /**
         * Local baseURL
         */
        {
            description: "returns relative URLs unchanged with a local base URL",
            baseURL: "http://10.0.0.1:5858",
            url: "/dashboard",
            trustedOrigins: [],
            expected: "/dashboard",
        },
        {
            description: "converts a same-origin local absolute URL to a relative path",
            baseURL: "http://10.0.0.1:5858",
            url: "http://10.0.0.1:5858/dashboard",
            trustedOrigins: [],
            expected: "/dashboard",
        },
        {
            description: "allows a different local IP when its origin is trusted",
            baseURL: "http://10.0.0.1:5858",
            url: "http://10.1.1.1:5858/dashboard",
            trustedOrigins: ["http://10.0.0.1:5858", "http://10.1.1.1:5858"],
            expected: "http://10.1.1.1:5858/dashboard",
        },
        {
            description: "rejects an untrusted local IP and port",
            baseURL: "http://10.0.0.1:5858",
            url: "http://10.0.0.0:5851/dashboard",
            trustedOrigins: [],
            expected: null,
        },
        {
            description: "rejects a different local IP when its origin is untrusted",
            baseURL: "http://10.0.0.1:5858",
            url: "http://10.1.1.1:5858/dashboard",
            trustedOrigins: [],
            expected: null,
        },
        {
            description: "rejects a public URL when the base URL is local",
            baseURL: "http://10.0.0.1:5858",
            url: "https://app.com/dashboard",
            trustedOrigins: [],
            expected: null,
        },
    ]

    for (const { description, baseURL, url, trustedOrigins, expected } of testCases) {
        test(description, () => {
            expect(getSafeURL({ baseURL, url, trustedOrigins })).toEqual(expected)
        })
    }
})
