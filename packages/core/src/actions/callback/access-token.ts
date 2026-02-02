import { fetchAsync } from "@/request.js"
import { AuthInternalError, OAuthProtocolError } from "@/errors.js"
import { OAuthAccessToken, OAuthAccessTokenErrorResponse, OAuthAccessTokenResponse } from "@/schemas.js"
import type { Logger, OAuthProviderCredentials } from "@/@types/index.js"

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
    logger?: Logger
) => {
    const parsed = OAuthAccessToken.safeParse({ ...oauthConfig, redirectURI, code, codeVerifier })
    if (!parsed.success) {
        //const msg = JSON.stringify(formatZodError(parsed.error), null, 2)
        logger?.log({
            facility: 10,
            severity: "error",
            timestamp: new Date().toISOString(),
            hostname: "aura-auth",
            appName: "aura-auth",
            msgId: "INVALID_OAUTH_CONFIGURATION",
            message: "The OAuth provider configuration is invalid.",
        })
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "The OAuth provider configuration is invalid.")
    }
    const { accessToken, clientId, clientSecret, code: codeParsed, redirectURI: redirectParsed } = parsed.data
    try {
        logger?.log({
            facility: 4,
            severity: "debug",
            msgId: "OAUTH_ACCESS_TOKEN_REQUEST_INITIATED",
            message: "Initiating OAuth access token request",
            structuredData: {
                client_id: clientId,
                client_secret: clientSecret,
                code: codeParsed,
                redirect_uri: redirectParsed,
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }
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
        const json = await response.json()
        const token = OAuthAccessTokenResponse.safeParse(json)
        if (!token.success) {
            const { success, data } = OAuthAccessTokenErrorResponse.safeParse(json)
            if (!success) {
                logger?.log({
                    facility: 10,
                    severity: "error",
                    timestamp: new Date().toISOString(),
                    hostname: "aura-auth",
                    appName: "aura-auth",
                    msgId: "INVALID_OAUTH_ACCESS_TOKEN_RESPONSE",
                    message: "Invalid access token response format.",
                })
                throw new OAuthProtocolError("INVALID_REQUEST", "Invalid access token response format")
            }
            logger?.log({
                facility: 10,
                severity: "error",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "OAUTH_ACCESS_TOKEN_ERROR",
                message: `OAuth access token error: ${data.error} - ${data?.error_description ?? "No description"}`,
            })
            throw new OAuthProtocolError("OAUTH_TOKEN_ERROR", "OAuth access token error")
        }
        return token.data
    } catch (error) {
        logger?.log({
            facility: 10,
            severity: "error",
            msgId: "OAUTH_ACCESS_TOKEN_REQUEST_FAILED",
            message: `OAuth access token request failed: ${(error as Error).message}`,
        })
        throw error
    }
}
