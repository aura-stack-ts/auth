import { OAuthSecureConfig } from "@/@types/index.js"
import { CodeSchema, OAuthConfigSchema, RedirectURISchema } from "@/schemas.js"

export const createAccessToken = async (oauthConfig: OAuthSecureConfig, redirectURI: string, code: string) => {
    const schema = OAuthConfigSchema.extend({ redirectURI: RedirectURISchema, code: CodeSchema })
    const parsed = schema.safeParse({ ...oauthConfig, redirectURI, code })
    if (!parsed.success) {
        throw new Error("Invalid OAuth configuration")
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
            throw new Error("Failed to create access token")
        }
        /**
         * Manage different response formats here if needed
         * - error and error_description
         * - access_token
         * - token_type
         */
        const data = await response.json()
        return data.access_token as string
    } catch {
        throw new Error(`Failed to retrieve accessToken from ${oauthConfig.name}`)
    }
}
