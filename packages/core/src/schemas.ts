import { object, string, enum as options, number, z, null as nullable, union, array, boolean } from "zod/v4"

const AuthorizeConfigSchema = z.union([
    string().url(),
    object({
        url: string().url(),
        params: object({
            owner: string().optional(),
            responseType: options(["code", "token", "id_token", "refresh_token"]).optional(),
            scope: string().optional(),
        }),
    }),
])

const AccessTokenConfigSchema = z.union([
    string().url(),
    object({
        url: string().url(),
        headers: z.record(string(), string()).optional(),
    }),
])

const UserInfoConfigSchema = z.union([
    string().url(),
    object({
        url: string().url(),
        request: z.function(),
    }),
    object({
        url: string().url(),
        headers: z.record(string(), string()).optional(),
        method: string().optional(),
    }),
])

export const OAuthProviderCredentialsSchema = object({
    id: string(),
    name: string(),
    authorize: AuthorizeConfigSchema.optional(),
    /** @deprecated */
    authorizeURL: string().url().optional(),
    accessToken: AccessTokenConfigSchema,
    /** @deprecated */
    scope: string().optional(),
    userInfo: UserInfoConfigSchema,
    /** @deprecated */
    responseType: options(["code", "token", "id_token", "refresh_token"]).optional(),
    clientId: string(),
    clientSecret: string(),
    profile: z.function().optional(),
})

/**
 * Schema for OAuth Provider Configuration
 */
export const OAuthProviderConfigSchema = object({
    authorize: AuthorizeConfigSchema.optional(),
    /** @deprecated */
    authorizeURL: string().url().optional(),
    accessToken: AccessTokenConfigSchema,
    /** @deprecated */
    scope: string().optional(),
    userInfo: UserInfoConfigSchema,
    /** @deprecated */
    responseType: options(["code", "token", "id_token", "refresh_token"]).optional(),
    clientId: string(),
    clientSecret: string(),
})

/**
 * Schema used to create the authorization URL for the OAuth flow and verify the
 * OAuth configuration.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
 */
export const OAuthAuthorization = OAuthProviderConfigSchema.extend({
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
    state: string({ message: "Missing state parameter in the OAuth authorization response." }),
    code: string({ message: "Missing code parameter in the OAuth authorization response." }),
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
export const OAuthAccessToken = OAuthProviderConfigSchema.extend({
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
    token_type: string().optional(),
    expires_in: number().optional(),
    refresh_token: string().optional(),
    scope: union([string().optional().or(nullable()), array(string()).optional()]),
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

export const OAuthEnvSchema = object({
    clientId: z.string().min(1, "OAuth Client ID is required in the environment variables."),
    clientSecret: z.string().min(1, "OAuth Client Secret is required in the environment variables."),
})

export const RedirectOptionsSchema = object({
    redirect: z.stringbool().optional().default(true),
    redirectTo: string().optional(),
})

export const CredentialsPayloadSchema = object({
    username: string(),
    password: string(),
})

/**
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
export const OpenIDMetadataSchema = object({
    issuer: string().url(),
    authorization_endpoint: string().url(),
    token_endpoint: string().url(),
    userinfo_endpoint: string().url(),
    jwks_uri: string().url(),
    registration_endpoint: string().url().optional(),
    scopes_supported: array(string()).optional(),
    response_types_supported: array(string()).optional(),
    response_modes_supported: array(string()).optional(),
    grant_types_supported: array(string()),
    acr_values_supported: array(string()).optional(),
    subject_types_supported: array(string()),
    id_token_signing_alg_values_supported: array(string()),
    id_token_encryption_alg_values_supported: array(string()).optional(),
    id_token_encryption_enc_values_supported: array(string()).optional(),
    userinfo_signing_alg_values_supported: array(string()).optional(),
    userinfo_encryption_alg_values_supported: array(string()).optional(),
    userinfo_encryption_enc_values_supported: array(string()).optional(),
    request_object_signing_alg_values_supported: array(string()).optional(),
    request_object_encryption_alg_values_supported: array(string()).optional(),
    request_object_encryption_enc_values_supported: array(string()).optional(),
    token_endpoint_auth_methods_supported: array(string()).optional(),
    token_endpoint_auth_signing_alg_values_supported: array(string()).optional(),
    display_values_supported: array(string()).optional(),
    claim_types_supported: array(string()).optional(),
    claims_supported: array(string()).optional(),
    service_documentation: string().url().optional(),
    claims_locales_supported: array(string()).optional(),
    ui_locales_supported: array(string()).optional(),
    claims_parameter_supported: boolean().optional(),
    request_parameter_supported: boolean().optional(),
    request_uri_parameter_supported: boolean().optional(),
    require_request_uri_registration: boolean().optional(),
    op_policy_uri: string().url().optional(),
    op_tos_uri: string().url().optional(),
}).passthrough()

export const OpenIDProviderSchema = object({
    id: string(),
    name: string(),
    issuer: string().url(),
    clientId: string().optional(),
    clientSecret: string().optional(),
    scope: string().optional(),
    profile: z.function().optional(),
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7517
 */
export const JWKSchema = object({
    kty: string(),
    kid: string().optional(),
    use: string().optional(),
    alg: string().optional(),
    n: string().optional(),
    e: string().optional(),
    x: string().optional(),
    y: string().optional(),
    crv: string().optional(),
}).passthrough()

export const JWKSResponseSchema = object({
    keys: array(JWKSchema),
})

export const OIDCAccessTokenResponseSchema = object({
    access_token: string(),
    token_type: string().optional(),
    expires_in: number().optional(),
    refresh_token: string().optional(),
    scope: union([string().optional().or(nullable()), array(string()).optional()]),
    id_token: string().optional(),
})

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 */
export const OIDCUserInfoSchema = object({
    sub: string(),
    name: string().optional(),
    given_name: string().optional(),
    family_name: string().optional(),
    middle_name: string().optional(),
    nickname: string().optional(),
    preferred_username: string().optional(),
    profile: string().url().optional(),
    picture: string().url().optional(),
    website: string().url().optional(),
    email: string().optional(),
    email_verified: boolean().optional(),
    gender: string().optional(),
    birthdate: string().optional(),
    zoneinfo: string().optional(),
    locale: string().optional(),
    phone_number: string().optional(),
    phone_number_verified: boolean().optional(),
    address: z.record(string(), z.unknown()).optional(),
    updated_at: number().optional(),
}).passthrough()

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
export const IDTokenClaimsSchema = object({
    iss: string(),
    sub: string(),
    aud: z.union([string(), array(string())]),
    exp: number(),
    iat: number(),
    nonce: string().optional(),
    azp: string().optional(),
    auth_time: number().optional(),
}).passthrough()
