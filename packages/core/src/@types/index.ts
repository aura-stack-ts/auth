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
    /**
     * OAuth integrations available in the authentication and authorization flows. It provides a type-inference
     * for the OAuth integrations that are supported by Aura Stack Auth; alternatively, you can provide a custom
     * OAuth third-party authorization service by implementing the `OAuthSecureConfig` interface.
     *
     * Built-in OAuth integrations:
     * oauth: ["github", "google"]
     *
     * Custom OAuth integrations:
     * oauth: [
     *   {
     *     id: "oauth-integration",
     *     name: "OAuth",
     *     authorizeURL: "https://example.com/oauth/authorize",
     *     accessToken: "https://example.com/oauth/token",
     *     scope: "profile email",
     *     responseType: "code",
     *     userInfo: "https://example.com/oauth/userinfo",
     *     clientId: process.env.AURA_AUTH_OAUTH_INTEGRATION_CLIENT_ID!,
     *     clientSecret: process.env.AURA_AUTH_OAUTH_INTEGRATION_CLIENT_SECRET!,
     *   }
     * ]
     */
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
