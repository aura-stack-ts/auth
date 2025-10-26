import { OAuthSecureConfig } from "@/@types/index.js"
import { toCastCase } from "@/utils.js"
import { OAuthConfigSchema, RedirectURISchema, StateSchema } from "@/schemas.js"

/**
 * Only supports basic OAuth 2.0 Authorization Code Flow without PKCE.
 * @todo: Add support for PKCE and other OAuth flows.
 */
export const createAuthorizationURL = (oauthConfig: OAuthSecureConfig, redirectURI: string, state: string) => {
    const schema = OAuthConfigSchema.extend({ redirectURI: RedirectURISchema, state: StateSchema })
    const parsed = schema.safeParse({ ...oauthConfig, state, redirectURI })
    if (!parsed.success) {
        throw new Error("Invalid OAuth configuration")
    }
    const { authorizeURL, ...options } = parsed.data
    const { userInfo, accessToken, clientSecret, ...required } = options
    const searchParams = new URLSearchParams(toCastCase(required))
    return `${authorizeURL}?${searchParams}`
}
