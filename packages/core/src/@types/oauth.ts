import type { User } from "@/@types/session.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"

export type AuthorizeParams = LiteralUnion<
    "clientId" | "prompt" | "scope" | "responseMode" | "audience" | "loginHint" | "nonce" | "display"
>

export type ResponseType = LiteralUnion<"code" | "token" | "refresh_token" | "id_token">

/**
 * Configuration for an OAuth provider without credentials.
 * Use this type when defining provider metadata and endpoints.
 */
export interface OAuthProviderConfig<Profile extends object = Record<string, any>, DefaultUser extends User = User> {
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
    accessToken:
        | string
        | {
              url: string
              headers?: Record<string, string>
          }
    userInfo:
        | string
        | {
              url: string
              headers?: Record<string, string>
              method?: string
          }
    /**
     * @deprecated
     * use `authorize.params.scope` instead of `scope`
     */
    scope?: string
    /**
     * @deprecated
     * use `authorize.params.response_type` instead of `responseType`
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

export type OAuthProviderRecord<DefaultUser extends User = User> = Record<
    LiteralUnion<BuiltInOAuthProvider>,
    OAuthProviderCredentials<any, DefaultUser>
>
