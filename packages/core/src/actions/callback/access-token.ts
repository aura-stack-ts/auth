import { fetchAsync } from "@/request.ts"
import { AuthInternalError, OAuthProtocolError } from "@/errors.ts"
import { OAuthAccessTokenErrorResponse, OAuthAccessTokenResponse } from "@/schemas.ts"
import type { InternalLogger, OAuthProviderCredentials } from "@/@types/index.ts"

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
    const { accessToken, clientId, clientSecret } = oauthConfig
    if (!clientId || !clientSecret || !redirectURI || !code || !codeVerifier || !accessToken) {
        logger?.log("INVALID_OAUTH_CONFIGURATION", {
            structuredData: {
                has_client_id: Boolean(clientId),
                has_client_secret: Boolean(clientSecret),
                has_access_token: Boolean(accessToken),
                has_redirect_uri: Boolean(redirectURI),
                has_code: Boolean(code),
                has_code_verifier: Boolean(codeVerifier),
            },
        })
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "The OAuth provider configuration is invalid.")
    }

    const tokenURL = typeof accessToken === "string" ? accessToken : accessToken.url
    const extraHeaders = typeof accessToken === "string" ? undefined : accessToken.headers

    try {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                has_client_id: Boolean(clientId),
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
            },
        })
        const response = await fetchAsync(tokenURL, {
            method: "POST",
            headers: {
                ...(extraHeaders ?? {}),
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectURI,
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
        console.log("Error fetching access token:", error)
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_FAILED")
        if (error instanceof Error) {
            throw new OAuthProtocolError("server_error", "Failed to communicate with OAuth provider", "", { cause: error })
        }
        throw error
    }
}
