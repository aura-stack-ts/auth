import type { infer as Infer } from "zod"
import type { User } from "@/@types/session.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { OAuthAccessTokenResponse, OIDCAccessTokenResponseSchema } from "@/schemas.ts"

export type { BuiltInOAuthProvider } from "@/oauth/index.ts"

export type OAuthAccessTokenResponseType = Infer<typeof OAuthAccessTokenResponse>
export type OIDCAccessTokenResponseType = Infer<typeof OIDCAccessTokenResponseSchema>

export type OIDCProviderContext = {
    issuer: string
    jwks_uri?: string
}

export type RuntimeOAuthProvider<
    Profile extends object = Record<string, any>,
    DefaultUser extends User = User,
> = OAuthProviderCredentials<Profile, DefaultUser> & {
    oidc?: OIDCProviderContext
}

export type AccessTokenContext = {
    /**
     * Access token string returned by the OAuth provider's token endpoint. The token
     * must be used to exchange for user information from the provider's userinfo endpoint.
     */
    accessToken: string
    /**
     * The access token type returned by the OAuth provider's token endpoint, typically "Bearer".
     */
    tokenType?: string | undefined
    /**
     * The number of seconds until the access token expires, as returned by the OAuth provider's
     * token endpoint.
     */
    expiresIn?: number | undefined
    /**
     * Optional refresh token returned by the OAuth provider's token endpoint, which can be
     * used to obtain a new access token when the current one expires.
     */
    refreshToken?: string | undefined
    /**
     * The scopes granted by the user for the access token, as returned by the OAuth provider's
     * token endpoint.
     */
    scope?: string | string[] | null | undefined
    /**
     * The userinfo endpoint URL of the OAuth provider. This is required to fetch user
     * information using the access token.
     */
    userInfoURL: string
}

/** Known query parameter names supported when building an OAuth authorization URL. */
export type AuthorizeParams = LiteralUnion<
    "clientId" | "prompt" | "scope" | "responseMode" | "audience" | "loginHint" | "nonce" | "display"
>

/** Known query parameter names supported when revoking an OAuth token. */
export type RevokeTokenParams = LiteralUnion<"tokenHint">

export type RevokeTokenTokenHint = LiteralUnion<"access_token" | "refresh_token">

/** OAuth 2.0 `response_type` values used in authorization requests. */
export type ResponseType = LiteralUnion<"code" | "token" | "refresh_token" | "id_token">

/**
 * Configuration for an OAuth provider without credentials.
 * Use this type when defining provider metadata and endpoints.
 */
export interface OAuthProviderConfig<Profile extends object = Record<string, any>, DefaultUser = User> {
    id: string
    name: string
    /**
     * @deprecated
     * use `authorize` instead of `authorizeURL`
     */
    authorizeURL?: string
    authorize:
        | string
        | {
              url: string
              params?: Partial<Record<AuthorizeParams, string> & { responseType: ResponseType }>
          }
    accessToken: string | { url: string; headers?: Record<string, string> }
    userInfo:
        | string
        | {
              url: string
              headers?: Record<string, string>
              method?: string
          }
        | {
              url: string
              request: (context: AccessTokenContext) => Profile | Promise<Profile>
          }
    /**
     * Refresh token configuration for the OAuth provider. This option allows refreshing access tokens
     * when they expire.
     */
    refreshToken?:
        | string
        | {
              url: string
              headers?: Record<string, string>
              params?: Record<string, string>
              authorization?: { type: "basic" | "credentials" }
          }
    /**
     * Revoke the access token configuration for the OAuth provider. It revokes the access token but not
     * invalidate the session when there are multiple access token configured for the session.
     */
    revokeToken?:
        | string
        | { url: string; headers?: Record<string, string>; params?: Record<RevokeTokenParams, RevokeTokenTokenHint> }
    /**
     * Refresh window in seconds before the access token expires to attempt a refresh.
     * Defaults to 300 seconds.
     */
    refreshWindow?: number
    /**
     * @deprecated
     * use `authorize.params.scope` instead of `scope`
     */
    scope?: string
    /**
     * @deprecated
     * use `authorize.params.responseType` instead of `responseType`
     */
    responseType?: ResponseType
    profile?: (profile: Profile) => DefaultUser | Promise<DefaultUser>
}

/**
 * OAuth provider configuration with client credentials.
 * Extends OAuthProviderConfig with clientId and clientSecret.
 */
export interface OAuthProviderCredentials<
    Profile extends object = Record<string, any>,
    DefaultUser extends User = User,
> extends OAuthProviderConfig<Profile, DefaultUser> {
    clientId?: string
    clientSecret?: string
}

/**
 * Complete OAuth provider type combining configuration and credentials.
 */
export type OAuthProvider<
    Profile extends object = Record<string, any>,
    DefaultUser extends User = User,
> = OAuthProviderCredentials<Profile, DefaultUser>

/**
 * Lookup table of configured OAuth providers keyed by built-in id or custom id.
 * Values are full credential configs used at runtime for authorize/token/userinfo.
 */
export type OAuthProviderRecord<DefaultUser extends User = User> = Record<
    LiteralUnion<BuiltInOAuthProvider>,
    RuntimeOAuthProvider<any, DefaultUser>
>

export type CustomUserInfoFunction = Extract<OAuthProviderConfig["userInfo"], { request: (context: AccessTokenContext) => any }>
