import { equals } from "@/utils.js"
import { timingSafeEqual } from "crypto"
import type { JWTPayloadWithToken } from "@/@types/index.js"

export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || value === null || value === undefined || Number.isNaN(value)
}

export const isRequest = (value: unknown): value is Request => {
    return typeof Request !== "undefined" && value instanceof Request
}

export const unsafeChars = [
    "<",
    ">",
    '"',
    "`",
    " ",
    "\r",
    "\n",
    "\t",
    "\\",
    "%2F",
    "%5C",
    "%2f",
    "%5c",
    "\r\n",
    "%0A",
    "%0D",
    "%0a",
    "%0d",
    "..",
    "//",
    "///",
    "...",
    "%20",
    "\0",
]

export const isValidURL = (value: string): boolean => {
    if (!new RegExp(/^https?:\/\/[^/]/).test(value)) {
        return false
    }
    const match = value.match(/^(https?:\/\/)(.*)$/)
    if (!match) return false
    const rest = match[2]
    for (const char of unsafeChars) {
        if (rest.includes(char)) return false
    }
    const regex =
        /^https?:\/\/(?:[a-zA-Z0-9._-]+|localhost|\[[0-9a-fA-F:]+\])(?::\d{1,5})?(?:\/[a-zA-Z0-9._~!$&'()?#*+,;=:@-]*)*\/?$/

    return regex.test(match[0])
}

export const isJWTPayloadWithToken = (payload: unknown): payload is JWTPayloadWithToken => {
    return typeof payload === "object" && payload !== null && "token" in payload && typeof payload?.token === "string"
}

export const isRelativeURL = (value: string): boolean => {
    if (value.length > 100) return false
    for (const char of unsafeChars) {
        if (value.includes(char)) return false
    }
    const regex = /^\/[a-zA-Z0-9\-_\/.?&=#]*\/?$/
    return regex.test(value)
}

export const isSameOrigin = (origin: string, expected: string): boolean => {
    const originURL = new URL(origin)
    const expectedURL = new URL(expected)
    return equals(originURL.origin, expectedURL.origin)
}

/**
 * Converts a trusted origin pattern to a regex for matching.
 * Supports `*` as subdomain wildcard: `https://*.example.com` matches `https://app.example.com`
 * @todo: add support to Custom URI Schemes (e.g. `myapp://*`).
 */
export const patternToRegex = (pattern: string): RegExp | null => {
    try {
        if (pattern.length > 2048) return null

        pattern = pattern.replace(/\\/g, "")
        const match = pattern.match(/^(https?):\/\/([a-zA-Z0-9.*-]{1,253})(?::(\d{1,5}|\*))?(?:\/.*)?$/)
        if (!match) return null

        const [, protocol, host, port] = match
        const hasWildcard = host.includes("*")
        if (hasWildcard && !host.startsWith("*.")) return null
        if (hasWildcard && host.slice(2).includes("*")) return null

        const domain = hasWildcard ? host.slice(2) : host
        const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const hostRegex = hasWildcard ? `[^.]+\\.${escapedDomain}` : escapedDomain
        const portRegex = port === "*" ? ":\\d{1,5}" : port ? `:${port}` : ""

        return new RegExp(`^${protocol}:\\/\\/${hostRegex}${portRegex}$`)
    } catch {
        return null
    }
}

/**
 * Checks if a URL matches any of the trusted origin patterns.
 * A URL is trusted if its origin matches any pattern (exact or wildcard).
 *
 * @param url - The URL to validate (e.g. from Referer, Origin, redirectTo)
 * @param trustedOrigins - Array of exact URLs or patterns (e.g. `https://*.example.com`)
 */
export const isTrustedOrigin = (url: string, trustedOrigins: string[]): boolean => {
    if (!isValidURL(url) || trustedOrigins.length === 0) return false
    try {
        const urlOrigin = new URL(url).origin
        for (const pattern of trustedOrigins) {
            const regex = patternToRegex(pattern)
            if (regex?.test(urlOrigin)) return true
            try {
                if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return true
            } catch {}
        }
    } catch {}
    return false
}

export const safeEquals = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    if (bufferA.length !== bufferB.length) {
        return false
    }
    return timingSafeEqual(bufferA, bufferB)
}
