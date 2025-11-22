import { toCastCase } from "@/utils.js"
import { OAuthAuthorization } from "@/schemas.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
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
        throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST, "Invalid OAuth configuration")
    }
    const { authorizeURL, ...options } = parsed.data
    const { userInfo, accessToken, clientSecret, ...required } = options
    const searchParams = new URLSearchParams(toCastCase(required))
    return `${authorizeURL}?${searchParams}`
}

/**
 * Creates the redirect URI for the OAuth callback based on the original request URL and the OAuth provider.
 *
 * @param requestURL - the original request URL
 * @param oauth - OAuth provider name
 * @returns The redirect URI for the OAuth callback.
 */
export const createRedirectURI = (requestURL: string, oauth: string) => {
    const url = new URL(requestURL)
    return `${url.origin}/auth/callback/${oauth}`
}

/**
 * Verifies if the request's origin matches the expected origin. It checks the 'Referer' header of the request
 * with the origin where is hosted the authentication flow. If they do not match, it throws an AuthError to avoid
 * potential `Open URL Redirection` attacks.
 *
 * @param request The incoming request object
 * @param hosted The expected origin URL
 * @returns The pathname of the referer URL if origins match
 */
export const createRedirectTo = (request: Request) => {
    try {
        const hosted = request.url
        const referer = request.headers.get("Referer")
        if (!referer) return "/"
        const originURL = new URL(hosted)
        const refererURL = new URL(referer)
        if (originURL.origin !== refererURL.origin) {
            throw new AuthError(
                ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST,
                "The origin of the request does not match the hosted origin."
            )
        }
        const pathname = refererURL.pathname
            .replace(/\/{2,}/g, "/")
            .replace(/\\+/g, "")
            .trim()
        if (pathname.includes("..")) {
            throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST, "The redirect path contains invalid segments.")
        }
        return pathname
    } catch (error) {
        if (isAuthError(error)) {
            throw error
        }
        throw new AuthError(ERROR_RESPONSE.AUTHORIZATION.INVALID_REQUEST, "Invalid origin.")
    }
}
