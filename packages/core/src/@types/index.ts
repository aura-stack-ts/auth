import { z } from "zod/v4"
import { createJoseInstance, JWTPayload } from "@/jose.js"
import { OAuthAccessTokenErrorResponse, OAuthAuthorizationErrorResponse } from "@/schemas.js"
import type { Prettify, RoutePattern } from "@aura-stack/router"
import type { SerializeOptions } from "cookie"
import type { LiteralUnion } from "./utility.js"
import type { BuiltInOAuthProvider } from "@/oauth/index.js"

export * from "./utility.js"

/**
 * Standard JWT claims that are managed internally by the token system.
 * These fields are typically filtered out before returning user data.
 */
export type JWTStandardClaims = Pick<JWTPayload, "exp" | "iat" | "jti" | "nbf" | "sub" | "aud" | "iss">

/**
 * Standardized user profile returned by OAuth providers after fetching user information
 * and mapping the response to this format by default or via the `profile` custom function.
 */
export interface User {
    sub: string
    name?: string
    email?: string
    image?: string
}

/**
 * Session data returned by the session endpoint.
 */
export interface Session {
    user: User
    expires: string
}

/**
 * Configuration for an OAuth provider without credentials.
 * Use this type when defining provider metadata and endpoints.
 */
export interface OAuthProviderConfig<Profile extends object = {}> {
    id: string
    name: string
    authorizeURL: string
    accessToken: string
    userInfo: string
    scope: string
    //responseType: "code" | "refresh_token" | "id_token"
    responseType: string
    profile?: (profile: Profile) => User | Promise<User>
}

/**
 * OAuth provider configuration with client credentials.
 * Extends OAuthProviderConfig with clientId and clientSecret.
 */
export interface OAuthProviderCredentials extends OAuthProviderConfig {
    clientId: string
    clientSecret: string
}

/**
 * Complete OAuth provider type combining configuration and credentials.
 */
export type OAuthProvider<Profile extends Record<string, unknown> = {}> = OAuthProviderConfig<Profile> & OAuthProviderCredentials

/**
 * Cookie type with __Secure- prefix, must be Secure.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
export type SecureCookie = { strategy: "secure" } & { options?: Prettify<Omit<SerializeOptions, "secure" | "encode">> }

/**
 * Cookie type with __Host- prefix, must be Secure, Path=/, no Domain attribute.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
export type HostCookie = { strategy: "host" } & {
    options?: Prettify<Omit<SerializeOptions, "secure" | "path" | "domain" | "encode">>
}

/**
 * Standard cookie type without security prefixes.
 * Can be sent over both HTTP and HTTPS connections (default in development).
 */
export type StandardCookie = { strategy?: "standard" } & { options?: Prettify<Omit<SerializeOptions, "encode">> }

/**
 * Union type for cookie options based on the specified strategy.
 * - `secure`: Cookies are only sent over HTTPS connections
 * - `host`: Cookies use the __Host- prefix and are only sent over HTTPS connections
 * - `standard`: Cookies can be sent over both HTTP and HTTPS connections (default in development)
 */
export type CookieStrategyOptions = StandardCookie | SecureCookie | HostCookie

/**
 * Configuration options for cookies used in Aura Auth.
 * @see {@link AuthConfig.cookies}
 */
export type CookieConfig = Prettify<
    {
        name?: string
    } & CookieStrategyOptions
>

/**
 * Internal representation of cookie configuration with all options resolved.
 * @internal
 */
export type CookieConfigInternal = {
    name?: string
    prefix?: string
} & SerializeOptions

/**
 * Names of cookies used by Aura Auth for session management and OAuth flows.
 * - `sessionToken`: User session JWT
 * - `csrfToken`: CSRF protection token
 * - `state`: OAuth state parameter for CSRF protection
 * - `code_verifier`: PKCE code verifier for authorization code flow
 * - `redirect_uri`: OAuth callback URI
 * - `redirect_to`: Post-authentication redirect path
 * - `nonce`: OpenID Connect nonce parameter
 */
export type CookieName = "sessionToken" | "csrfToken" | "state" | "nonce" | "code_verifier" | "redirect_to" | "redirect_uri"

/**
 * Main configuration interface for Aura Auth.
 * This is the user-facing configuration object passed to `createAuth()`.
 */
export interface AuthConfig {
    /**
     * OAuth providers available in the authentication and authorization flows. It provides a type-inference
     * for the OAuth providers that are supported by Aura Stack Auth; alternatively, you can provide a custom
     * OAuth third-party authorization service by implementing the `OAuthProviderCredentials` interface.
     *
     * Built-in OAuth providers:
     * oauth: ["github", "google"]
     *
     * Custom OAuth providers:
     * oauth: [
     *   {
     *     id: "oauth-providers",
     *     name: "OAuth",
     *     authorizeURL: "https://example.com/oauth/authorize",
     *     accessToken: "https://example.com/oauth/token",
     *     scope: "profile email",
     *     responseType: "code",
     *     userInfo: "https://example.com/oauth/userinfo",
     *     clientId: process.env.AURA_AUTH_OAUTH_PROVIDER_CLIENT_ID!,
     *     clientSecret: process.env.AURA_AUTH_OAUTH_PROVIDER_CLIENT_SECRET!,
     *   }
     * ]
     */
    oauth: (BuiltInOAuthProvider | OAuthProviderCredentials)[]
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
    cookies?: CookieConfig
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
     * @experimental
     */
    trustedProxyHeaders?: boolean
}

export type JoseInstance = ReturnType<typeof createJoseInstance>

/**
 * Internal runtime configuration used within Aura Auth after initialization.
 * All optional fields from AuthConfig are resolved to their default values.
 * @internal
 * @todo: is this needed?
 */
export interface AuthRuntimeConfig {
    oauth: Record<LiteralUnion<BuiltInOAuthProvider>, OAuthProviderCredentials>
    cookies: CookieConfig
    secret: string
    jose: JoseInstance
}

export interface RouterGlobalContext {
    oauth: Record<LiteralUnion<BuiltInOAuthProvider>, OAuthProviderCredentials>
    cookies: CookieConfigInternal
    jose: JoseInstance
    basePath: string
    trustedProxyHeaders: boolean
}

export interface AuthInstance {
    handlers: {
        GET: (request: Request) => Response | Promise<Response>
        POST: (request: Request) => Response | Promise<Response>
    }
    jose: JoseInstance
}

/**
 * Base OAuth error response structure.
 */
export interface OAuthError<T extends string> {
    error: T
    error_description?: string
}

/**
 * OAuth 2.0 Authorization Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
 */
export type AuthorizationError = OAuthError<z.infer<typeof OAuthAuthorizationErrorResponse>["error"]>

/**
 * OAuth 2.0 Access Token Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export type AccessTokenError = OAuthError<z.infer<typeof OAuthAccessTokenErrorResponse>["error"]>

/**
 * OAuth 2.0 Token Revocation Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc7009#section-2.2.1
 */
export type TokenRevocationError = OAuthError<"invalid_session_token" | "invalid_csrf_token" | "invalid_redirect_to">

export type ErrorType = AuthorizationError["error"] | AccessTokenError["error"] | TokenRevocationError["error"]