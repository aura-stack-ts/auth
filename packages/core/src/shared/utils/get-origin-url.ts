import { getBaseURL } from "@/config/get-base-url.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { equals, patternToRegex } from "@/shared/utils.ts"
import { getTrustedOrigins } from "@/config/get-trusted-origins.ts"
import type { GlobalContext } from "@aura-stack/router/types"

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
export const isRelativeURL = (value: string): boolean => {
    if (value.length > 100) return false
    for (const char of unsafeChars) {
        if (value.includes(char)) return false
    }
    const regex = /^\/[a-zA-Z0-9\-_/.?&=#]*\/?$/
    return regex.test(value)
}

export const isSameOrigin = (origin: string, expected: string): boolean => {
    const originURL = new URL(origin)
    const expectedURL = new URL(expected)
    return equals(originURL.origin, expectedURL.origin)
}

export const getOriginURL = async (request: Request, context?: GlobalContext) => {
    const trustedOrigins = [...(await getTrustedOrigins(request, context?.trustedOrigins))]
    if (!context?.trustedProxyHeaders) {
        const requestOrigin = new URL(request.url).origin
        if (!trustedOrigins.includes(requestOrigin)) trustedOrigins.push(requestOrigin)
    }
    const origin = await getBaseURL({ request, ctx: context })
    if (!isTrustedOrigin(origin, trustedOrigins)) {
        context?.logger?.log("UNTRUSTED_ORIGIN", { structuredData: { origin: origin } })
        throw new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN" })
    }
    return origin
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

/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks.
 * Only relative URLs (starting with /) are allowed; absolute URLs are
 * rejected and replaced with "/" to enforce same-origin redirects.
 */
export const validateRedirectTo = (url: string): string => {
    if (!isRelativeURL(url) && !isValidURL(url)) return "/"
    if (isRelativeURL(url)) return url
    return "/"
}
