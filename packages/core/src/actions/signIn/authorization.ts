import { OAuthSecureConfig } from "@/@types/index.js"
import { toCastCase } from "@/utils.js"
import { OAuthAuthorization } from "@/schemas.js"
import { AuthError, ERROR_RESPONSE } from "@/error.js"

/**
 * Constructs the request URI for the Authorization Request to the third-party OAuth service. It includes
 * the necessary query parameters such as `client_id`, `redirect_uri`, `response_type`, `scope`, and `state`.
 * Only supports basic OAuth 2.0 Authorization Code Flow without PKCE.
 *
 * @todo: Add support for PKCE and other OAuth flows.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
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
