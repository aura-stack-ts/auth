import { object, string, enum as options, number, url } from "zod/v4"
import { AuthConfigInternal } from "./@types/index.js"

/**
 * Schema for OAuth Integration Configuration
 */
export const OAuthConfigSchema = object({
    authorizeURL: url(),
    accessToken: url(),
    scope: string().optional(),
    userInfo: url(),
    responseType: options(["code", "token", "id_token"]),
    clientId: string(),
    clientSecret: string(),
})

/**
 * Schema used to create the authorization URL for the OAuth flow and verify the
 * OAuth configuration.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
 */
export const OAuthAuthorization = OAuthConfigSchema.extend({
    redirectURI: string(),
    state: string(),
    codeChallenge: string(),
    codeChallengeMethod: options(["plain", "S256"]),
})

/**
 * Schema used in the callback action to validate the authorization response when the resource owner
 * has granted.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2
 */
export const OAuthAuthorizationResponse = object({
    state: string(),
    code: string(),
})

/**
 * Schema used in the callback action to validate the authorization error response when the resource owner
 * has denied the authorization request.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
 */
export const OAuthAuthorizationErrorResponse = object({
    error: options([
        "invalid_request",
        "unauthorized_client",
        "access_denied",
        "unsupported_response_type",
        "invalid_scope",
        "server_error",
        "temporarily_unavailable",
    ]),
    error_description: string().optional(),
    error_uri: string().optional(),
    state: string(),
})

/**
 * Schema for OAuth Access Token Request and OAuth Configuration
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
 */
export const OAuthAccessToken = OAuthConfigSchema.extend({
    redirectURI: string(),
    code: string(),
    codeVerifier: string().min(43).max(128),
})

/**
 * Schema for OAuth Access Token Response
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
 * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4
 */
export const OAuthAccessTokenResponse = object({
    access_token: string(),
    token_type: string(),
    expires_in: number().optional(),
    refresh_token: string().optional(),
    scope: string().optional(),
})

/**
 * Schema for OAuth Access Token Error Response
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export const OAuthAccessTokenErrorResponse = object({
    error: options([
        "invalid_request",
        "invalid_client",
        "invalid_grant",
        "unauthorized_client",
        "unsupported_grant_type",
        "invalid_scope",
    ]),
    error_description: string().optional(),
    error_uri: string().optional(),
})

/**
 * @todo: verify if this schema is still needed
 * @deprecated
 */
export const OAuthErrorResponse = object({
    error: string(),
    error_description: string().optional(),
})
