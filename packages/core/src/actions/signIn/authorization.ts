import { isValidURL } from "@/assert.js"
import { OAuthAuthorization } from "@/schemas.js"
import { equals, getNormalizedOriginPath, sanitizeURL, toCastCase } from "@/utils.js"
import { AuthError, ERROR_RESPONSE, InvalidRedirectToError, isAuthError } from "@/error.js"
import type { OAuthSecureConfig } from "@/@types/index.js"

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
    oauthConfig: OAuthSecureConfig,
    redirectURI: string,
    state: string,
    codeChallenge: string,
    codeChallengeMethod: string
) => {
    const parsed = OAuthAuthorization.safeParse({ ...oauthConfig, redirectURI, state, codeChallenge, codeChallengeMethod })
    if (!parsed.success) {
        throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.SERVER_ERROR, "Invalid OAuth configuration")
    }
    const { authorizeURL, ...options } = parsed.data
    const { userInfo, accessToken, clientSecret, ...required } = options
    const searchParams = new URLSearchParams(toCastCase(required))
    return `${authorizeURL}?${searchParams}`
}

export const getOriginURL = (request: Request, trustedProxyHeaders?: boolean) => {
    const headers = request.headers
    if (trustedProxyHeaders) {
        const protocol = headers.get("X-Forwarded-Proto") ?? headers.get("Forwarded")?.match(/proto=([^;]+)/i)?.[1] ?? "http"
        const host =
            headers.get("X-Forwarded-Host") ??
            headers.get("Host") ??
            headers.get("Forwarded")?.match(/host=([^;]+)/i)?.[1] ??
            null
        return new URL(`${protocol}://${host}${getNormalizedOriginPath(new URL(request.url).pathname)}`)
    } else {
        return new URL(getNormalizedOriginPath(request.url))
    }
}

/**
 * Creates the redirect URI for the OAuth callback based on the original request URL and the OAuth provider.
 *
 * @param requestURL - the original request URL
 * @param oauth - OAuth provider name
 * @returns The redirect URI for the OAuth callback.
 */
export const createRedirectURI = (request: Request, oauth: string, basePath: string, trustedProxyHeaders?: boolean) => {
    const url = getOriginURL(request, trustedProxyHeaders)
    return `${url.origin}${basePath}/callback/${oauth}`
}

/**
 * Verifies if the request's origin matches the expected origin. It accepts the redirectTo search
 * parameter for redirection. It checks the 'Referer' header of the request with the origin where
 * the authentication flow is hosted. If they do not match, it throws an AuthError to avoid
 * potential `Open URL Redirection` attacks.
 *
 * @param request The incoming request object
 * @param redirectTo Optional redirectTo parameter to override the referer
 * @returns The pathname of the referer URL if origins match
 */
export const createRedirectTo = (request: Request, redirectTo?: string, trustedProxyHeaders?: boolean) => {
    try {
        const headers = request.headers
        const origin = headers.get("Origin")
        const referer = headers.get("Referer")
        let hostedURL = getOriginURL(request, trustedProxyHeaders)
        if (redirectTo) {
            if (redirectTo.startsWith("/")) {
                return sanitizeURL(redirectTo)
            }
            const redirectToURL = new URL(sanitizeURL(getNormalizedOriginPath(redirectTo)))
            if (!isValidURL(redirectTo) || !equals(redirectToURL.origin, hostedURL.origin)) {
                throw new InvalidRedirectToError()
            }
            return sanitizeURL(redirectToURL.pathname)
        }
        if (referer) {
            const refererURL = new URL(sanitizeURL(referer))
            if (!isValidURL(referer) || !equals(refererURL.origin, hostedURL.origin)) {
                throw new AuthError(
                    ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST,
                    "The referer of the request does not match the hosted origin."
                )
            }
            return sanitizeURL(refererURL.pathname)
        }
        if (origin) {
            const originURL = new URL(sanitizeURL(getNormalizedOriginPath(origin)))
            if (!isValidURL(origin) || !equals(originURL.origin, hostedURL.origin)) {
                throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST, "Invalid origin (potential CSRF).")
            }
            return sanitizeURL(originURL.pathname)
        }
        return "/"
    } catch (error) {
        if (isAuthError(error)) {
            throw error
        }
        throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST, "Invalid origin (potential CSRF).")
    }
}
