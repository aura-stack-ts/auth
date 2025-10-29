import { object, string, enum as options } from "zod/v4"

/**
 * Schema for OAuth Integration Configuration
 */
export const OAuthConfigSchema = object({
    authorizeURL: string(),
    accessToken: string(),
    scope: string().optional(),
    userInfo: string(),
    responseType: options(["code", "token", "id_token"]),
    clientId: string(),
    clientSecret: string(),
})

export const OAuthAuthorization = OAuthConfigSchema.extend({
    redirectURI: string(),
    state: string(),
})

/**
 * Schema for OAuth authorization parameters sent during the authorization workflow
 * from the OAuth provider back to the application.
 */
export const OAuthAuthorizationSearchParams = object({
    state: string(),
    code: string(),
    /**
     * @todo: implement error handling for OAuth authorization errors
     */
    error: string().optional(),
    error_description: string().optional(),
})

/**
 * Schema for cookies stored during the OAuth authorization workflow.
 */
export const CallbackCookies = object({
    state: string(),
    original_uri: string(),
})

export const OAuthAccessToken = OAuthConfigSchema.extend({
    redirectURI: string(),
    code: string(),
})

export const OAuthAccessTokenResponse = object({
    access_token: string(),
    token_type: string().optional(),
})

export const OAuthErrorResponse = object({
    error: string(),
    error_description: string().optional(),
})
