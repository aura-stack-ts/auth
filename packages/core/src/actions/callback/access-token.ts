import type { OAuthSecureConfig } from "@/@types/index.js"
import { AuraAuthError, throwAuraAuthError } from "@/error.js"
import { OAuthAccessToken, OAuthAccessTokenResponse, OAuthErrorResponse } from "@/schemas.js"

export const createAccessToken = async (oauthConfig: OAuthSecureConfig, redirectURI: string, code: string) => {
    const parsed = OAuthAccessToken.safeParse({ ...oauthConfig, redirectURI, code })
    if (!parsed.success) {
        throw new AuraAuthError("invalid_request", "Invalid OAuth configuration")
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
            }).toString(),
        })
        const json = await response.json()
        const errorResponse = OAuthAccessTokenResponse.safeParse(json)
        if (!errorResponse.success) {
            const { success, data } = OAuthErrorResponse.safeParse(json)
            if (!success) {
                throw new AuraAuthError("invalid_request", "Invalid access token response format")
            }
            throw new AuraAuthError(data.error, data?.error_description ?? "Failed to retrieve access token")
        }
        return errorResponse.data
    } catch (error) {
        throwAuraAuthError(error, "Failed to create access token")
    }
}
