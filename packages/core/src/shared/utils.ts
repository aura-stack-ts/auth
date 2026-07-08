import { getEnv } from "@/shared/env.ts"
import { getCookie } from "@/cookie.ts"
import { verifyCSRF } from "@/shared/crypto.ts"
import { encoder } from "@aura-stack/jose/crypto"
import { AuraAuthError } from "@/shared/errors.ts"
import { isRelativeURL, isValidURL } from "@/shared/assert.ts"
import type { JWTManager, OAuthTokenPayload } from "@/@types/session.ts"
import type { CookieStoreConfig, InternalLogger, JoseInstance } from "@/@types/config.ts"

export const AURA_AUTH_VERSION = "0.7.2"

export const equals = (a: string | number | undefined | null, b: string | number | undefined | null) => {
    if (a === null || b === null || a === undefined || b === undefined) return false
    return a === b
}

export const getBaseURL = (request: Request) => {
    const url = new URL(request.url)
    return `${url.origin}${url.pathname}`
}

export const isSecureConnection = (request: Request | Headers, trustedProxyHeaders: boolean): boolean => {
    const headers = request instanceof Headers ? request : request.headers
    const url = request instanceof Headers ? null : request.url
    return trustedProxyHeaders
        ? url?.startsWith("https://") ||
              headers.get("X-Forwarded-Proto") === "https" ||
              (headers.get("Forwarded")?.includes("proto=https") ?? false)
        : (url?.startsWith("https://") ?? false)
}

export const extractPath = (url: string): string => {
    const pathRegex = /^https?:\/\/[a-zA-Z0-9_\-.]+(:\d+)?(\/.*)$/
    const match = url.match(pathRegex)
    return match && match[2] ? match[2] : "/"
}

export const getErrorName = (error: unknown): string => {
    if (error instanceof Error) {
        return error.name
    }
    return typeof error === "string" ? error : "UnknownError"
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

export const timingSafeEqual = (a: string, b: string): boolean => {
    const bufferA = encoder.encode(a)
    const bufferB = encoder.encode(b)
    const len = Math.max(bufferA.length, bufferB.length)
    let diff = 0
    for (let i = 0; i < len; i++) {
        diff |= (bufferA[i] ?? 0) ^ (bufferB[i] ?? 0)
    }
    return diff === 0 && bufferA.length === bufferB.length
}

export const createBasicAuthHeader = (username: string, password: string): string => {
    const getUsername = getEnv(username) ?? username
    const getPassword = getEnv(password) ?? password
    if (!getUsername || !getPassword) {
        throw new AuraAuthError({ code: "AUTH_BASIC_CREDENTIALS_INVALID" })
    }
    const credentials = `${getUsername}:${getPassword}`
    const binaryCredentials = String.fromCharCode.apply(null, Array.from(encoder.encode(credentials)))
    return `Basic ${btoa(binaryCredentials)}`
}

export const toUnionHeaders = (init: Headers, headers: HeadersInit): Headers => {
    new Headers(headers).forEach((value, key) => {
        if (!init.has(key)) {
            if (key.toLowerCase() === "set-cookie") {
                init.append(key, value)
            } else {
                init.set(key, value)
            }
        }
    })
    return init
}

export const verifySessionToken = async ({
    headers,
    cookies,
    jwt,
    logger,
}: {
    headers: Headers
    jwt: JWTManager
    cookies: CookieStoreConfig
    logger: InternalLogger | undefined
}) => {
    let session = null
    try {
        session = getCookie(headers, cookies.sessionToken.name)
    } catch (cause) {
        logger?.log("SESSION_NOT_FOUND")
        throw new AuraAuthError({ code: "SESSION_NOT_FOUND", cause })
    }
    if (!session) {
        logger?.log("SESSION_NOT_FOUND")
        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
    }
    try {
        await jwt.verifyToken(session)
    } catch (error) {
        logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
        throw new AuraAuthError({ code: "SESSION_INVALID", cause: error })
    }
}

export const verifyCSRFToken = async ({
    headers,
    skipCSRFCheck,
    cookies,
    logger,
    jose,
}: {
    headers: Headers
    skipCSRFCheck: boolean
    cookies: CookieStoreConfig
    logger: InternalLogger | undefined
    jose: JoseInstance
}): Promise<boolean> => {
    let csrfToken = null
    const header = headers.get("X-CSRF-Token")

    try {
        csrfToken = getCookie(headers, cookies.csrfToken.name)
    } catch (cause) {
        logger?.log("CSRF_TOKEN_MISSING")
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING", cause })
    }
    logger?.log("CSRF_TOKEN_REQUESTED", {
        structuredData: {
            has_csrf_token: Boolean(csrfToken),
            has_csrf_header: Boolean(header),
            skip_csrf_check: skipCSRFCheck,
        },
    })
    if (!skipCSRFCheck) {
        if (!csrfToken) {
            logger?.log("CSRF_TOKEN_MISSING")
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
        }
        if (!header) {
            logger?.log("CSRF_HEADER_MISSING")
            throw new AuraAuthError({ code: "CSRF_DOUBLE_SUBMIT_FAILED" })
        }
        try {
            await verifyCSRF(jose, csrfToken, header)
        } catch (error) {
            logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISMATCH" })
        }
        logger?.log("CSRF_TOKEN_VERIFIED")
    }
    return true
}

export const shouldRefresh = (payload: OAuthTokenPayload, refreshWindow: number): boolean => {
    const now = Math.floor(Date.now() / 1000)
    if (now >= payload.expiresAt) return true
    if (payload.expiresAt - now <= refreshWindow) return true
    return false
}

export const merge = (origin: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in origin) {
            Object.assign(source[key], merge(origin[key] as Record<string, unknown>, source[key] as Record<string, unknown>))
        }
    }
    return { ...origin, ...source }
}
