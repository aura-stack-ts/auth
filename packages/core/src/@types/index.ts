import { z } from "zod/v4"
import type { OAuthIntegrations } from "@/oauth/index.js"
import { OAuthAccessTokenErrorResponse, OAuthAuthorizationErrorResponse } from "@/schemas.js"

/**
 * Standardized user profile returned by OAuth integrations after fetching user information
 * and mapping the response to this format by default or via `profile` custom profile function.
 */
export interface OAuthUserProfile {
    sub: string
    name?: string
    email?: string
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

/**
 * OAuth 2.0 Authorization Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
 */
export type AuthorizationErrorResponse = z.infer<typeof OAuthAuthorizationErrorResponse>["error"]

/**
 * OAuth 2.0 Access Token Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export type AccessTokenErrorResponse = z.infer<typeof OAuthAccessTokenErrorResponse>["error"]

export interface OAuthErrorResponse<Errors extends "authorization" | "token"> {
    error: LiteralUnion<Errors extends "authorization" ? AuthorizationErrorResponse : AccessTokenErrorResponse>
    error_description?: string
}

export type ErrorTypes = AuthorizationErrorResponse | AccessTokenErrorResponse
