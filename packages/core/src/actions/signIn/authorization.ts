import { getEnv } from "@/env.ts"
import { AuthInternalError } from "@/errors.ts"
import { equals, extractPath } from "@/utils.ts"
import { isRelativeURL, isSameOrigin, isValidURL, isTrustedOrigin, patternToRegex } from "@/assert.ts"
import type { AuthConfig } from "@/@types/index.ts"
import type { GlobalContext } from "@aura-stack/router"

/**
 * Resolves trusted origins from config (array or function).
 */
export const getTrustedOrigins = async (request: Request, trustedOrigins: AuthConfig["trustedOrigins"]): Promise<string[]> => {
    if (!trustedOrigins) return []
    const raw = typeof trustedOrigins === "function" ? await trustedOrigins(request) : trustedOrigins
    return Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
}

export const getBaseURL = async ({
    ctx,
    request,
    headers: headersInit,
}: {
    ctx?: GlobalContext
    request?: Request
    headers?: HeadersInit
}) => {
    const origin = getEnv("BASE_URL") || ctx?.baseURL
    if (origin) return origin
    if (ctx?.trustedProxyHeaders) {
        const headers = (headersInit && new Headers(headersInit)) || request?.headers
        const protocol = headers?.get("Forwarded")?.match(/proto=([^;]+)/i)?.[1] ?? headers?.get("X-Forwarded-Proto") ?? "http"
        const host =
            headers?.get("Host") ??
            headers?.get("Forwarded")?.match(/host=([^;]+)/i)?.[1] ??
            headers?.get("X-Forwarded-Host") ??
            null
        return `${protocol}://${host}`
    }
    try {
        return new URL(request?.url ?? "not-found").origin
    } catch {
        throw new AuthInternalError(
            "INVALID_OAUTH_CONFIGURATION",
            "The URL cannot be constructed. Please set the BASE_URL environment variable or enable trustedProxyHeaders."
        )
    }
}

export const getOriginURL = async (request: Request, context?: GlobalContext) => {
    const trustedOrigins = await getTrustedOrigins(request, context?.trustedOrigins)
    trustedOrigins.push(new URL(request.url).origin)
    const origin = await getBaseURL({ request, ctx: context })
    if (!isTrustedOrigin(origin, trustedOrigins)) {
        context?.logger?.log("UNTRUSTED_ORIGIN", { structuredData: { origin: origin } })
        throw new AuthInternalError("UNTRUSTED_ORIGIN", "The constructed origin URL is not trusted.")
    }
    return origin
}

/**
 * Creates the redirect URI for the OAuth callback based on the original request URL and the OAuth provider.
 *
 * @param requestURL - the original request URL
 * @param oauth - OAuth provider name
 * @param context - Global context containing configuration and utilities
 * @returns The redirect URI for the OAuth callback.
 */
export const createRedirectURI = async (request: Request, oauth: string, context: GlobalContext) => {
    const origin = await getOriginURL(request, context)
    return `${origin}${context.basePath}/callback/${oauth}`
}

export const unstable_createRedirectURI = async ({}) => {}

/**
 * Verifies if the request's origin matches the expected origin. It accepts the redirectTo search
 * parameter for redirection. It checks the Referer and Origin headers and the request URL against
 * the trusted origins list. If they do not match, it returns "/" to avoid potential open redirect attacks.
 *
 * When `trustedOrigins` is provided, URLs are validated against that list. When not provided,
 * the request's derived origin (from request.url or proxy headers) is used as the only trusted origin.
 *
 * @param request The incoming request object
 * @param redirectTo Optional redirectTo parameter to override the referer
 * @param context Global context containing configuration and utilities
 * @returns A safe URL to redirect to after authentication, or "/" if the URL is not considered safe.
 */
export const createRedirectTo = async (request: Request, redirectTo?: string, context?: GlobalContext) => {
    try {
        const headers = request.headers
        const requestOrigin = await getOriginURL(request, context)
        const origins = await getTrustedOrigins(request, context?.trustedOrigins)

        const validateURL = (url: string): string => {
            if (!isRelativeURL(url) && !isValidURL(url)) return "/"
            if (isRelativeURL(url)) return url

            if (origins.length > 0) {
                if (isTrustedOrigin(url, origins)) {
                    const urlOrigin = new URL(url).origin
                    for (const pattern of origins) {
                        const regex = patternToRegex(pattern)
                        if (regex?.test(urlOrigin)) {
                            return isSameOrigin(url, request.url) ? extractPath(url) : url
                        }
                        if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return url
                    }
                }
                context?.logger?.log("OPEN_REDIRECT_ATTACK")
                return "/"
            }
            if (isSameOrigin(url, requestOrigin)) {
                return extractPath(url)
            }
            context?.logger?.log("OPEN_REDIRECT_ATTACK")
            return "/"
        }
        return validateURL(redirectTo ?? headers.get("Referer") ?? headers.get("Origin") ?? "/")
    } catch (error) {
        context?.logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED")
        return "/"
    }
}
