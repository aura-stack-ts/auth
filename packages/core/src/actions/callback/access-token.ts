import { fetchAsync } from "@/request.js"
import { AuthInternalError, OAuthProtocolError } from "@/errors.js"
import { OAuthAccessToken, OAuthAccessTokenErrorResponse, OAuthAccessTokenResponse } from "@/schemas.js"
import type { InternalLogger, OAuthProviderCredentials } from "@/@types/index.js"

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
    codeVerifier: string,
    logger?: InternalLogger
) => {
    const parsed = OAuthAccessToken.safeParse({ ...oauthConfig, redirectURI, code, codeVerifier })
    if (!parsed.success) {
        logger?.log("INVALID_OAUTH_CONFIGURATION")
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "The OAuth provider configuration is invalid.")
    }
    const { accessToken, clientId, clientSecret, code: codeParsed, redirectURI: redirectParsed } = parsed.data
    try {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                has_client_id: Boolean(clientId),
                redirect_uri: redirectParsed,
                grant_type: "authorization_code",
            },
        })
        const response = await fetchAsync(accessToken, {
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

        if (!response.ok) {
            logger?.log("INVALID_OAUTH_ACCESS_TOKEN_RESPONSE")
            throw new OAuthProtocolError("invalid_request", "Invalid access token response")
        }

        const json = await response.json()
        const token = OAuthAccessTokenResponse.safeParse(json)
        if (!token.success) {
            const { success, data } = OAuthAccessTokenErrorResponse.safeParse(json)
            if (!success) {
                logger?.log("INVALID_OAUTH_ACCESS_TOKEN_RESPONSE")
                throw new OAuthProtocolError("invalid_request", "Invalid access token response format")
            }
            logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: {
                    error: data.error,
                    error_description: data.error_description ?? "",
                },
            })
            throw new OAuthProtocolError("INVALID_ACCESS_TOKEN", "Failed to retrieve access token")
        }

        logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS")
        return token.data
    } catch (error) {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_FAILED")
        if (error instanceof Error) {
            throw new OAuthProtocolError("server_error", "Failed to communicate with OAuth provider", "", { cause: error })
        }
        throw error
    }
}
