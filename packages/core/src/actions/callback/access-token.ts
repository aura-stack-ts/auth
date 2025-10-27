import { OAuthSecureConfig } from "@/@types/index.js"
import { AuraStackError } from "@/error.js"
import { OAuthAccessToken, OAuthAccessTokenResponse, OAuthErrorResponse } from "@/schemas.js"

export const createAccessToken = async (oauthConfig: OAuthSecureConfig, redirectURI: string, code: string) => {
    const parsed = OAuthAccessToken.safeParse({ ...oauthConfig, redirectURI, code })
    if (!parsed.success) {
        throw new AuraStackError("Invalid OAuth configuration")
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
        if (!response.ok) {
            throw new AuraStackError("Failed to create access token")
        }
        const json = await response.json()
        const validResponse = OAuthAccessTokenResponse.safeParse(json)
        if (!validResponse.success) {
            const errorResponse = OAuthErrorResponse.safeParse(json)
            if (!errorResponse.success) {
                throw new AuraStackError("Invalid access token response format")
            }
            return Response.json(errorResponse.data, { status: 400 })
        }
        return json.access_token as string
    } catch {
        throw new AuraStackError(`Failed to retrieve accessToken from ${oauthConfig.name}`)
    }
}
