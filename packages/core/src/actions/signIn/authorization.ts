import { AuthInternalError } from "@/errors.js"
import { OAuthAuthorization } from "@/schemas.js"
import { equals, extractPath, toCastCase } from "@/utils.js"
import { isRelativeURL, isSameOrigin, isValidURL, isTrustedOrigin, patternToRegex } from "@/assert.js"
import type { GlobalContext } from "@aura-stack/router"
import type { AuthConfig, InternalLogger, OAuthProviderCredentials } from "@/@types/index.js"

/**
 * Constructs the request URI for the Authorization Request to the third-party OAuth service. It includes
 * the necessary query parameters such as `client_id`, `redirect_uri`, `response_type`, `scope`, `state`,
 * `code_challenge`, and `code_challenge_method`.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
 * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4
 *
 * @param oauthConfig - The OAuth configuration for the third-party service.
 * @param redirectURI - The redirect URI where the OAuth service will send the user after authorization.
 * @param state - A unique string used to maintain state between the request and callback.
 */
export const createAuthorizationURL = (
    oauthConfig: OAuthProviderCredentials,
    redirectURI: string,
    state: string,
    codeChallenge: string,
    codeChallengeMethod: string,
    logger?: InternalLogger
) => {
    const parsed = OAuthAuthorization.safeParse({ ...oauthConfig, redirectURI, state, codeChallenge, codeChallengeMethod })
    if (!parsed.success) {
        logger?.log("INVALID_OAUTH_CONFIGURATION", {
            structuredData: {
                scope: oauthConfig.scope,
                redirect_uri: redirectURI,
                has_state: Boolean(state),
                has_code_challenge: Boolean(codeChallenge),
                code_challenge_method: codeChallengeMethod,
            },
        })
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "The OAuth provider configuration is invalid.")
    }
    const { authorizeURL, ...options } = parsed.data
    const { userInfo, accessToken, clientSecret, ...required } = options
    const searchParams = new URLSearchParams(toCastCase(required))
    return `${authorizeURL}?${searchParams}`
}

export const getOriginURL = (request: Request, trustedProxyHeaders?: boolean, logger?: InternalLogger) => {
    let origin = new URL(request.url).origin
    const headers = request.headers
    if (trustedProxyHeaders) {
        const protocol = headers.get("X-Forwarded-Proto") ?? headers.get("Forwarded")?.match(/proto=([^;]+)/i)?.[1] ?? "http"
        const host =
            headers.get("X-Forwarded-Host") ??
            headers.get("Host") ??
            headers.get("Forwarded")?.match(/host=([^;]+)/i)?.[1] ??
            null
        origin = `${protocol}://${host}`
    }
    if (!isValidURL(origin)) {
        logger?.log("INVALID_URL", { structuredData: { origin: origin } })
        throw new AuthInternalError("INVALID_URL", "The constructed origin URL is invalid.")
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
    const origin = getOriginURL(request, context.trustedProxyHeaders, context.logger)
    return `${origin}${context.basePath}/callback/${oauth}`
}

/**
 * Resolves trusted origins from config (array or function).
 */
export const getTrustedOrigins = async (request: Request, trustedOrigins: AuthConfig["trustedOrigins"]): Promise<string[]> => {
    if (!trustedOrigins) return []
    const raw = typeof trustedOrigins === "function" ? await trustedOrigins(request) : trustedOrigins
    return Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
}

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
        const origins = await getTrustedOrigins(request, context?.trustedOrigins)
        const requestOrigin = getOriginURL(request, context?.trustedProxyHeaders, context?.logger)

        const validateURL = (url: string): string => {
            if (!isRelativeURL(url) && !isValidURL(url)) return "/"
            if (isRelativeURL(url)) return url

            if (origins.length > 0 && isTrustedOrigin(url, origins)) {
                const urlOrigin = new URL(url).origin
                for (const pattern of origins) {
                    const regex = patternToRegex(pattern)
                    if (regex?.test(urlOrigin)) {
                        return isSameOrigin(url, requestOrigin) ? extractPath(url) : url
                    }
                    if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return url
                }
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
