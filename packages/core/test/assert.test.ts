import { isRelativeURL, isValidURL, matchesTrustedOrigin } from "@/assert.js"
import { describe, test, expect } from "vitest"

describe("isRelativeURL", () => {
    const testCases = [
        {
            description: "Valid relative URL",
            input: "/valid-path",
            expected: true,
        },
        {
            description: "Valid relative URL with hyphens and underscores",
            input: "/valid-path_with-mixed.characters",
            expected: true,
        },
        {
            description: "relative URL with numbers",
            input: "/users/12123/profile",
            expected: true,
        },
        {
            description: "Valid relative URL with trailing slash",
            input: "/another-valid-path/",
            expected: true,
        },
        {
            description: "Invalid URL with protocol",
            input: "http://example.com",
            expected: false,
        },
        {
            description: "Invalid URL with newline character",
            input: "/invalid-path\n",
            expected: false,
        },
        {
            description: "Invalid URL with carriage return",
            input: "/invalid-path\r",
            expected: false,
        },
        {
            description: "URL with script tag",
            input: "/path<script>",
            expected: false,
        },
        {
            description: "URL with multiple slashes",
            input: "//example.com",
            expected: false,
        },
        {
            description: "URL with encoded slash",
            input: "/%2F/example.com",
            expected: false,
        },
        {
            description: "URL with encoded backslash",
            input: "/%5C/example.com",
            expected: false,
        },
        {
            description: "URL with escaped backslash",
            input: "/\\/example.com",
            expected: false,
        },
        {
            description: "URL with escaped backslash only",
            input: "\\/example.com",
            expected: false,
        },
        {
            description: "URL with full-width slash",
            input: "／dashboard",
            expected: false,
        },
        {
            description: "URL with encoded directory traversal",
            input: "/..%2F..%2F..%2dashboard",
            expected: false,
        },
        {
            description: "URL with directory traversal",
            input: "/../../dashboard",
            expected: false,
        },
        {
            description: "JavaScript protocol scheme",
            input: "javascript:alert(1)",
            expected: false,
        },
        {
            description: "VBScript protocol scheme",
            input: 'vbscript:msgbox("XSS")',
            expected: false,
        },
        {
            description: "File protocol scheme",
            input: "file:///etc/passwd",
            expected: false,
        },
        {
            description: "Mailto protocol scheme",
            input: "mailto:example@redirect.com",
            expected: false,
        },
        {
            description: "Tel protocol scheme",
            input: "tel:+1234567890",
            expected: false,
        },
        {
            description: "URL with search parameters",
            input: "/search?query=test&sort=asc",
            expected: true,
        },
        {
            description: "URL with hash fragment",
            input: "/page#section1",
            expected: true,
        },
    ]

    for (const { description, input, expected } of testCases) {
        test(description, () => {
            expect(isRelativeURL(input)).toBe(expected)
        })
    }
})

describe("isValidURL", () => {
    const testCases = [
        {
            description: "URL with valid http protocol",
            input: "https://yourdomain.com/dashboard",
            expected: true,
        },
        {
            description: "URL with subdomain",
            input: "https://api.yourdomain.com/v1/data",
            expected: true,
        },
        {
            description: "URL with www subdomain",
            input: "https://www.yourdomain.com/about",
            expected: true,
        },
        {
            description: "URL with search parameters",
            input: "https://yourdomain.com/search?q=test&page=1",
            expected: true,
        },
        {
            description: "URL with mixed case domain",
            input: "https://example.com/auth/signIn?next=123",
            expected: true,
        },
        {
            description: "URL with hash fragment",
            input: "https://yourdomain.com/docs#introduction",
            expected: true,
        },
        {
            description: "URL with port number",
            input: "https://yourdomain.com:8443/api",
            expected: true,
        },
        {
            description: "URL with complex path and allowed domain",
            input: "https://app.yourdomain.com/users/123/profile/edit",
            expected: true,
        },
        {
            description: "Block javascript protocol",
            input: "javascript:alert('xss')",
            expected: false,
        },
        {
            description: "Block data URL",
            input: "data:text/html,<script>alert(1)</script>",
            expected: false,
        },
        {
            description: "Block file protocol",
            input: "file:///etc/passwd",
            expected: false,
        },
        {
            description: "Block vbscript protocol",
            input: "vbscript:msgbox('xss')",
            expected: false,
        },
        {
            description: "Block ftp protocol",
            input: "ftp://yourdomain.com/files",
            expected: false,
        },
        {
            description: "Block mailto protocol",
            input: "mailto:admin@yourdomain.com",
            expected: false,
        },
        {
            description: "Block tel protocol",
            input: "tel:+1234567890",
            expected: false,
        },
        {
            description: "Block URL with < character",
            input: "https://yourdomain.com/page<script>",
            expected: false,
        },
        {
            description: "Block URL with > character",
            input: "https://yourdomain.com/page>alert",
            expected: false,
        },
        {
            description: "Block URL with double quotes",
            input: 'https://yourdomain.com/page"onclick="',
            expected: false,
        },
        {
            description: "Block URL with backticks",
            input: "https://yourdomain.com/page`template`",
            expected: false,
        },
        {
            description: "Block URL with newline",
            input: "https://yourdomain.com/page\nmalicious",
            expected: false,
        },
        {
            description: "Block URL with carriage return",
            input: "https://yourdomain.com/page\rmalicious",
            expected: false,
        },
        {
            description: "Block URL with tab character",
            input: "https://yourdomain.com/page\tmalicious",
            expected: false,
        },
        {
            description: "Block URL with null byte",
            input: "https://yourdomain.com/page\0malicious",
            expected: false,
        },
        {
            description: "Block URL with backslash",
            input: "https://yourdomain.com/path\\malicious",
            expected: false,
        },
    ]

    for (const { description, input, expected } of testCases) {
        test(description, () => {
            expect(isValidURL(input)).toBe(expected)
        })
    }
})

describe("matchesTrustedOrigin", () => {
    const testCases = [
        {
            description: "exact URL match",
            url: "https://example.com/auth",
            trustedOrigins: ["https://example.com"],
            expected: true,
        },
        {
            description: "exact URL with port match",
            url: "https://example.com:3000/dashboard",
            trustedOrigins: ["https://example.com:3000"],
            expected: true,
        },
        {
            description: "subdomain wildcard matches app subdomain",
            url: "https://app.example.com/auth",
            trustedOrigins: ["https://*.example.com"],
            expected: true,
        },
        {
            description: "subdomain wildcard matches api subdomain",
            url: "https://api.example.com/v1",
            trustedOrigins: ["https://*.example.com"],
            expected: true,
        },
        {
            description: "subdomain wildcard does not match apex domain",
            url: "https://example.com/auth",
            trustedOrigins: ["https://*.example.com"],
            expected: false,
        },
        {
            description: "subdomain wildcard does not match different domain",
            url: "https://malicious.com/auth",
            trustedOrigins: ["https://*.example.com"],
            expected: false,
        },
        {
            description: "multiple trusted origins - matches second",
            url: "https://admin.example.com",
            trustedOrigins: ["https://example.com", "https://*.example.com"],
            expected: true,
        },
        {
            description: "URL not in trusted list",
            url: "https://evil.com/phishing",
            trustedOrigins: ["https://example.com"],
            expected: false,
        },
        {
            description: "empty trusted origins returns false",
            url: "https://example.com",
            trustedOrigins: [],
            expected: false,
        },
        {
            description: "invalid URL returns false",
            url: "not-a-valid-url",
            trustedOrigins: ["https://example.com"],
            expected: false,
        },
        {
            description: "URL with subdomain wildcard and different port",
            url: "http://www.sub.example.com:8080",
            trustedOrigins: ["http://*.example.com:3000"],
            expected: false,
        },
        {
            description: "URL with subdomain wildcard and no port",
            url: "http://www.sub.example.com",
            trustedOrigins: ["http://*.example.com"],
            expected: false,
        },
        {
            description: "URL with subdomain wildcard and port",
            url: "http://www.sub.example.com:8080",
            trustedOrigins: ["http://*.example.com"],
            expected: false,
        },
        {
            description: "Custom URL schema",
            url: "myapp://callback",
            trustedOrigins: ["myapp://callback"],
            expected: false,
        },
        {
            description: "Custom URL schema with wildcard",
            url: "myapp://callback",
            trustedOrigins: ["myapp://*"],
            expected: false,
        },
    ]

    for (const { description, url, trustedOrigins, expected } of testCases) {
        test(description, () => {
            expect(matchesTrustedOrigin(url, trustedOrigins)).toBe(expected)
        })
    }
})
