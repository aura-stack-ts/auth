import { fetchAsync } from "@/shared/fetch-async.ts"
import { assertContentTypeResponse } from "@/shared/assert.ts"
import { isOIDCProvider } from "@/actions/oidc/resolve-provider.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { OAuthAccessTokenErrorResponse, OAuthAccessTokenResponse, OIDCAccessTokenResponseSchema } from "@/schemas.ts"
import type { InternalLogger, RuntimeOAuthProvider, OAuthAccessTokenResponseType } from "@/@types/index.ts"

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
    oauthConfig: RuntimeOAuthProvider,
    redirectURI: string,
    code: string,
    codeVerifier: string,
    logger?: InternalLogger
): Promise<OAuthAccessTokenResponseType & { id_token?: string }> => {
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
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_URL_CONFIG" })
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
                ...extraHeaders,
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
            throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RESPONSE" })
        }
        assertContentTypeResponse(response, logger)
        const json = await response.json()
        const tokenSchema = isOIDCProvider(oauthConfig) ? OIDCAccessTokenResponseSchema : OAuthAccessTokenResponse
        const token = tokenSchema.safeParse(json)
        if (!token.success) {
            const { success, data } = OAuthAccessTokenErrorResponse.safeParse(json)
            if (!success) {
                logger?.log("INVALID_OAUTH_ACCESS_TOKEN_RESPONSE")
                throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT" })
            }
            logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: {
                    error: data.error,
                    error_description: data.error_description ?? "",
                },
            })
            throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT" })
        }

        logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS")
        return token.data
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_FAILED")
        throw new AuraAuthError({ code: "UNKNOWN_OAUTH_ACCESS_TOKEN_ERROR", cause: error })
    }
}
