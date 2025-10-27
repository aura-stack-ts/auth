import { OAuthSecureConfig } from "@/@types/index.js"
import { toCastCase } from "@/utils.js"
import { OAuthAuthorization } from "@/schemas.js"
import { AuraStackError } from "@/error.js"

/**
 * Only supports basic OAuth 2.0 Authorization Code Flow without PKCE.
 * @todo: Add support for PKCE and other OAuth flows.
 */
export const createAuthorizationURL = (oauthConfig: OAuthSecureConfig, redirectURI: string, state: string) => {
    const parsed = OAuthAuthorization.safeParse({ ...oauthConfig, state, redirectURI })
    if (!parsed.success) {
        throw new AuraStackError("Invalid OAuth configuration")
    }
    const { authorizeURL, ...options } = parsed.data
    const { userInfo, accessToken, clientSecret, ...required } = options
    const searchParams = new URLSearchParams(toCastCase(required))
    return `${authorizeURL}?${searchParams}`
}
