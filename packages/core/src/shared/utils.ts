import { getEnv } from "@/shared/env.ts"
import { encoder } from "@aura-stack/jose/crypto"
import { AuthInternalError } from "@/shared/errors.ts"
import { isRelativeURL, isValidURL } from "@/shared/assert.ts"
import type { ZodError } from "zod/v4"
import type { APIErrorMap } from "@/@types/index.ts"

export const AURA_AUTH_VERSION = "0.5.0"

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

export const formatZodError = <T extends Record<string, unknown> = Record<string, unknown>>(error: ZodError<T>): APIErrorMap => {
    if (!error.issues || error.issues.length === 0) {
        return {}
    }
    return error.issues.reduce((previous, issue) => {
        const key = issue.path.join(".")
        return {
            ...previous,
            [key]: {
                code: issue.code,
                message: issue.message,
            },
        }
    }, {})
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
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "Missing client credentials for OAuth provider configuration.")
    }
    const credentials = `${getUsername}:${getPassword}`
    const binaryCredentials = String.fromCharCode.apply(null, Array.from(encoder.encode(credentials)))
    return `Basic ${btoa(binaryCredentials)}`
}

export const toUnionHeaders = (init: Headers, headers: HeadersInit): Headers => {
    new Headers(headers).forEach((value, key) => {
        if (!init.has(key)) {
            init.set(key, value)
        }
    })
    return init
}
