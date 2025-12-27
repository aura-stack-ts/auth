import { AuthInternalError, OAuthProtocolError } from "@/errors.js"
import { OAuthAccessToken, OAuthAccessTokenErrorResponse, OAuthAccessTokenResponse } from "@/schemas.js"
import type { OAuthProviderCredentials } from "@/@types/index.js"
import { formatZodError } from "@/utils.js"

/**
 * Make a request to the OAuth provider to the token endpoint to exchange the authorization code provided
 * by the authorization server.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5
 * @param oauthConfig - OAuth provider configuration
 * @param redirectURI - The redirect URI registered in the Resource Owner's authorization request and sent in the authorization code exchange
 * @param code - The authorization code received from the OAuth server
 * @returns The access token response from the OAuth server
 */
export const createAccessToken = async (
    oauthConfig: OAuthProviderCredentials,
    redirectURI: string,
    code: string,
    codeVerifier: string
) => {
    const parsed = OAuthAccessToken.safeParse({ ...oauthConfig, redirectURI, code, codeVerifier })
    if (!parsed.success) {
        const msg = formatZodError(parsed.error).toString()
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", msg)
    }
    const { accessToken, clientId, clientSecret, code: codeParsed, redirectURI: redirectParsed } = parsed.data
    try {
        const response = await fetch(accessToken, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: codeParsed,
                redirect_uri: redirectParsed,
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }).toString(),
        })
        const json = await response.json()
        const token = OAuthAccessTokenResponse.safeParse(json)
        if (!token.success) {
            const { success, data } = OAuthAccessTokenErrorResponse.safeParse(json)
            if (!success) {
                throw new OAuthProtocolError("INVALID_REQUEST", "Invalid access token response format")
            }
            throw new OAuthProtocolError(data.error, data?.error_description ?? "Failed to retrieve access token")
        }
        return token.data
    } catch (error) {
        /**
         * @todo: review error handling here
         */
        //throw throwAuthError(error, "Failed to create access token")
        throw error
    }
}
