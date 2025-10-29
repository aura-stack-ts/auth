import type { OAuthIntegrations } from "@/oauth/index.js"

export interface OAuthUserProfile {
    id: string
    email?: string
    name?: string
    image?: string
}

export interface OAuthConfig<Profile extends object = {}> {
    id: string
    name: string
    authorizeURL: string
    accessToken: string
    userInfo: string
    scope: string
    responseType: string
    profile?: (profile: Profile) => OAuthUserProfile | Promise<OAuthUserProfile>
}

export interface OAuthSecureConfig extends OAuthConfig {
    clientId: string
    clientSecret: string
}

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

export interface AuthConfig {
    oauth: (OAuthIntegrations | OAuthSecureConfig)[]
}

export interface AuthConfigInternal {
    oauth: Record<LiteralUnion<OAuthIntegrations>, OAuthSecureConfig>
}

export type ErrorTypes =
    | "invalid_request"
    | "unauthorized_client"
    | "access_denied"
    | "unsupported_response_type"
    | "invalid_scope"
    | "server_error"
    | "temporarily_unavailable"

export interface ErrorResponse {
    error: LiteralUnion<ErrorTypes>
    error_description?: string
}
