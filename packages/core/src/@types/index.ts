import { z } from "zod/v4"
import { SerializeOptions } from "cookie"
import { createJoseInstance } from "@/jose.js"
import { SESSION_VERSION } from "@/actions/session/session.js"
import { OAuthAccessTokenErrorResponse, OAuthAuthorizationErrorResponse } from "@/schemas.js"
import type { RoutePattern } from "@aura-stack/router"
import type { OAuthIntegrations } from "@/oauth/index.js"

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

/**
 * Internal OAuth user profile used in the session payload, extending the standard OAuthUserProfile
 * with additional fields such as `integrations` and `version`.
 */
export interface OAuthUserProfileInternal extends OAuthUserProfile {
    integrations: LiteralUnion<OAuthIntegrations>[]
    version: typeof SESSION_VERSION
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

export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Cookie type with __Secure- prefix, must be Secure.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
type SecureCookie = { flag: "secure" } & { options?: Prettify<Omit<SerializeOptions, "secure" | "encode">> }

/**
 * Cookie type with __Host- prefix, must be Secure, Path=/, no Domain attribute.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
type HostCookie = { flag: "host" } & { options?: Prettify<Omit<SerializeOptions, "secure" | "path" | "domain" | "encode">> }

export type StandardCookie = { flag?: "standard" } & { options?: Prettify<Omit<SerializeOptions, "encode">> }

/**
 * Union type for cookie options based on the specified flag.
 *  - secure: Cookies are only sent over HTTPS connections.
 *  - host: Cookies use the __Host- prefix and are only sent over HTTPS connections.
 *  - standard: Cookies can be sent over both HTTP and HTTPS connections. (default in development)
 */
export type CookieFlagOptions = StandardCookie | SecureCookie | HostCookie

export type CookieOptions = {
    name?: string
} & CookieFlagOptions

export type CookieOptionsInternal = {
    name?: string
    prefix?: string
} & SerializeOptions

/**
 * Names of cookies used by Aura Auth for session management and OAuth flows
 */
export type CookieName = "sessionToken" | "csrfToken" | "state" | "pkce" | "nonce" | "code_verifier"

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
    /**
     * Cookie options defines the configuration for cookies used in Aura Auth.
     * It includes a prefix for cookie names and flag options to determine
     * the security and scope of the cookies.
     *
     * **⚠️ WARNING:** Ensure that the cookie options are configured correctly to
     * maintain the security and integrity of the authentication process. `Aura Auth`
     * is not responsible for misconfigured cookies that may lead to security vulnerabilities.
     *
     * - prefix: A string prefix to be added to all cookie names, by default "aura-stack".
     * - flag options (This attributes help to define the security level of the cookies):
     *   - secure: Cookies use the __Secure- prefix and are only sent over HTTPS connections.
     *   - host: Cookies use the __Host- prefix and are only sent over HTTPS connections.
     *   - standard: Cookies can be sent over both HTTP and HTTPS connections. (default in development)
     *
     * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
     * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
     */
    cookies?: CookieOptions
    /**
     * Secret used to sign and verify JWT tokens for session and csrf protection.
     * If not provided, it will load from the environment variable `AURA_AUTH_SECRET`, but if it
     * doesn't exist, it will throw an error during the initialization of the Auth module.
     */
    secret?: string
    /**
     * Base path for all authentication routes. Default is `/auth`.
     */
    basePath?: RoutePattern
    /**
     * Enable trusted proxy headers for scenarios where the application is behind a reverse proxy or load balancer.
     * This setting allows Aura Auth to correctly interpret headers like `X-Forwarded-For` and `X-Forwarded-Proto`
     * to determine the original client IP address and protocol.
     *
     * Default is `false`. Enable this option only if you are certain that your application is behind a trusted proxy.
     * Misconfiguration can lead to security vulnerabilities, such as incorrect handling of secure cookies or
     * inaccurate client IP logging.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
     */
    trustedProxyHeaders?: boolean
}

export interface AuthConfigInternal {
    oauth: Record<LiteralUnion<OAuthIntegrations>, OAuthSecureConfig>
    cookies: CookieOptions
    secret: string
    jose: Awaited<ReturnType<typeof createJoseInstance>>
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

export type TokenRevocationErrorResponse = "invalid_session_token"

export interface OAuthErrorResponse<Errors extends "authorization" | "token" | "signOut"> {
    error: LiteralUnion<
        Errors extends "authorization"
            ? AuthorizationErrorResponse
            : Errors extends "token"
              ? AccessTokenErrorResponse
              : TokenRevocationErrorResponse
    >
    error_description?: string
}

export type ErrorTypes = AuthorizationErrorResponse | AccessTokenErrorResponse | TokenRevocationErrorResponse
