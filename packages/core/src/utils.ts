import { isRouterError, RouterConfig } from "@aura-stack/router"
import { isAuthError } from "./error.js"

export const toSnakeCase = (str: string) => {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase()
        .replace(/^_+/, "")
}

export const toUpperCase = (str: string) => {
    return str.toUpperCase()
}

export const toCastCase = <Obj extends Record<string, any>, Type extends "snake" | "upper">(
    obj: Obj,
    type: Type = "snake" as Type
) => {
    return Object.entries(obj).reduce((previous, [key, value]) => {
        const newKey = type === "snake" ? toSnakeCase(key) : toUpperCase(key)
        return { ...previous, [newKey]: value }
    }, {}) as Type extends "snake"
        ? { [K in keyof Obj as `${string & K}`]: Obj[K] }
        : { [K in keyof Obj as Uppercase<string & K>]: Obj[K] }
}

export const equals = (a: string | number | undefined | null, b: string | number | undefined | null) => {
    if (a === null || b === null || a === undefined || b === undefined) return false
    return a === b
}

/**
 * Sanitizes a URL by removing dangerous patterns that could be used for path traversal
 * or other attacks. This function:
 * - Decodes URL-encoded characters
 * - Removes multiple consecutive slashes (preserving protocol slashes)
 * - Removes path traversal patterns (..)
 * - Removes trailing slashes (except root)
 * - Trims whitespace
 *
 * @param url - The URL or path to sanitize
 * @returns The sanitized URL or path
 */
export const sanitizeURL = (url: string) => {
    try {
        let decodedURL = decodeURIComponent(url).trim()
        const protocolMatch = decodedURL.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)/)
        let protocol = ""
        let rest = decodedURL
        if (protocolMatch) {
            protocol = protocolMatch[1]
            rest = decodedURL.slice(protocol.length)
            const slashIndex = rest.indexOf("/")
            if (slashIndex === -1) {
                return protocol + rest
            }
            const domain = rest.slice(0, slashIndex)
            let path = rest
                .slice(slashIndex)
                .replace(/\/\.\.\//g, "/")
                .replace(/\/\.\.$/, "")
                .replace(/\.{2,}/g, "")
                .replace(/\/{2,}/g, "/")
            if (path !== "/" && path.endsWith("/")) {
                path = path.replace(/\/+$/, "/")
            } else if (path !== "/") {
                path = path.replace(/\/+$/, "")
            }
            return protocol + domain + path
        }
        let sanitized = decodedURL
            .replace(/\/\.\.\//g, "/")
            .replace(/\/\.\.$/, "")
            .replace(/\.{2,}/g, "")
            .replace(/\/{2,}/g, "/")

        if (sanitized !== "/" && sanitized.endsWith("/")) {
            sanitized = sanitized.replace(/\/+$/, "/")
        } else if (sanitized !== "/") {
            sanitized = sanitized.replace(/\/+$/, "")
        }
        return sanitized
    } catch {
        return url.trim()
    }
}

/**
 * Validates that a path is a safe relative path to prevent open redirect attacks.
 * A safe relative path must:
 * - Start with '/'
 * - Not contain protocol schemes (://)
 * - Not contain newline characters
 * - Not contain null bytes
 * - Not be an absolute URL
 *
 * @param path - The path to validate
 * @returns true if the path is safe, false otherwise
 */
export const isValidRelativePath = (path: string | undefined | null): boolean => {
    if (!path || typeof path !== "string") return false
    if (!path.startsWith("/") || path.includes("://") || path.includes("\r") || path.includes("\n")) return false
    if (/[\x00-\x1F\x7F]/.test(path) || path.includes("\0")) return false
    const sanitized = sanitizeURL(path)
    if (sanitized.includes("..")) return false
    return true
}

export const onErrorHandler: RouterConfig["onError"] = (error) => {
    if (isRouterError(error)) {
        const { message, status, statusText } = error
        return Response.json({ error: "invalid_request", error_description: message }, { status, statusText })
    }
    if (isAuthError(error)) {
        const { type, message } = error
        return Response.json({ error: type, error_description: message }, { status: 400 })
    }
    return Response.json({ error: "server_error", error_description: "An unexpected error occurred" }, { status: 500 })
}

/**
 * Extracts and normalizes the origin and pathname from a URL string.
 * Removes query parameters and hash fragments for a clean path.
 * Falls back to the original string if URL parsing fails.
 *
 * @param path - The URL or path string to process
 * @returns The normalized URL with origin and pathname, or the original path
 */
export const getNormalizedOriginPath = (path: string): string => {
    try {
        const url = new URL(path)
        url.hash = ""
        url.search = ""
        return `${url.origin}${url.pathname}`
    } catch {
        return sanitizeURL(path)
    }
}

export const toISOString = (date: Date | string | number): string => {
    return new Date(date).toISOString()
}

export const useSecureCookies = (request: Request, trustedProxyHeaders: boolean): boolean => {
    return trustedProxyHeaders
        ? request.url.startsWith("https://") ||
              request.headers.get("X-Forwarded-Proto") === "https" ||
              (request.headers.get("Forwarded")?.includes("proto=https") ?? false)
        : request.url.startsWith("https://")
}
