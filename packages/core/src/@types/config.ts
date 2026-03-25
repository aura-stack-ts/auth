import { createJoseInstance } from "@/jose.ts"
import { createLogEntry } from "@/shared/logger.ts"
import { createAuthAPI } from "@/api/createApi.ts"
import type { Prettify } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { OAuthProviderCredentials, OAuthProviderRecord } from "@/@types/oauth.ts"
import type { SerializeOptions } from "@aura-stack/router/cookie"
import type { JWTKey, SessionConfig, SessionStrategy, User } from "@/@types/session.ts"

/**
 * Main configuration interface for Aura Auth.
 * This is the user-facing configuration object passed to `createAuth()`.
 */
export interface AuthConfig<DefaultUser extends User = User> {
    /**
     * OAuth providers available in the authentication and authorization flows. It provides a type-inference
     * for the OAuth providers that are supported by Aura Stack Auth; alternatively, you can provide a custom
     * OAuth third-party authorization service by implementing the `OAuthProviderCredentials` interface.
     *
     * Built-in OAuth providers:
     * oauth: ["github", "google"]
     *
     * Custom credentials via factory:
     * oauth: [github({ clientId: "...", clientSecret: "..." })]
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
     *     clientId: process.env.AURA_AUTH_PROVIDER_CLIENT_ID,
     *     clientSecret: process.env.AURA_AUTH_PROVIDER_CLIENT_SECRET,
     *   }
     * ]
     */
    oauth: (BuiltInOAuthProvider | OAuthProviderCredentials<any, DefaultUser>)[]
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
    cookies?: Partial<CookieConfig>
    /**
     * Secret used to sign and verify JWT tokens for session and csrf protection.
     * If not provided, it will load from the environment variable `AURA_AUTH_SECRET` or `AUTH_SECRET`, but if it
     * doesn't exist, it will throw an error during the initialization of the Auth module.
     */
    secret?: JWTKey
    /**
     * Base URL of the application, used to construct the incoming request's origin.
     */
    baseURL?: string
    /**
     * Base path for all authentication routes. Default is `/auth`.
     */
    basePath?: `/${string}`
    /**
     * Enable trusted proxy headers for scenarios where the application is behind a reverse proxy or load balancer.
     * This setting allows Aura Auth to correctly interpret headers like `X-Forwarded-For` and `X-Forwarded-Proto`
     * to determine the original client IP address and protocol.
     *
     * Default is `false`. Enable this option only if you are certain that your application is behind a trusted proxy.
     * Misconfiguration can lead to security vulnerabilities, such as incorrect handling of secure cookies or
     * inaccurate client IP logging.
     *
     * This value can also be set via environment variable as `AURA_AUTH_TRUSTED_PROXY_HEADERS`
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
     * @experimental
     */
    trustedProxyHeaders?: boolean
    /**
     * Logger configuration for handling authentication-related logs and errors. It can be set to `true`,
     * `DEBUG=true`, `LOG_LEVEL=debug`, or a custom logger. It implements the syslog format.
     */
    logger?: boolean | Logger
    /**
     * Defines trusted origins for your application to prevent open redirect attacks.
     * URLs from the Referer header, Origin header, request URL, and redirectTo option
     * are validated against this list before redirecting.
     *
     * - **Exact URL**: `https://example.com` matches only that origin.
     * - **Subdomain wildcard**: `https://*.example.com` matches `https://app.example.com`, `https://api.example.com`, etc.
     * @example
     * trustedOrigins: ["https://example.com", "https://*.example.com", "http://localhost:3000"]
     *
     *
     * trustedOrigins: async (request) => {
     *   const origin = new URL(request.url).origin
     *   return [origin, "https://admin.example.com"]
     * }
     */
    trustedOrigins?: TrustedOrigin[] | ((request: Request) => Promise<TrustedOrigin[]> | TrustedOrigin[])
    /**
     * Defines the session management strategy for Aura Auth. It determines how sessions are created, stored, and validated.
     */
    session?: SessionConfig
}

/**
 * Cookie type with __Secure- prefix, must be Secure.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
export type SecureCookie = { strategy: "secure" } & Prettify<Omit<SerializeOptions, "secure" | "encode">>

/**
 * Cookie type with __Host- prefix, must be Secure, Path=/, no Domain attribute.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
export type HostCookie = { strategy: "host" } & Prettify<Omit<SerializeOptions, "secure" | "path" | "domain" | "encode">>

/**
 * Standard cookie type without security prefixes.
 * Can be sent over both HTTP and HTTPS connections (default in development).
 */
export type StandardCookie = { strategy?: "standard" } & Prettify<Omit<SerializeOptions, "encode">>

/**
 * Union type for cookie options based on the specified strategy.
 * - `secure`: Cookies are only sent over HTTPS connections
 * - `host`: Cookies use the __Host- prefix and are only sent over HTTPS connections
 * - `standard`: Cookies can be sent over both HTTP and HTTPS connections (default in development)
 */
export type CookieStrategyAttributes = StandardCookie | SecureCookie | HostCookie

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
export type CookieName = "sessionToken" | "csrfToken" | "state" | "codeVerifier" | "redirectTo" | "redirectURI"

export type CookieStoreConfig = Record<CookieName, { name: string; attributes: CookieStrategyAttributes }>

export interface CookieConfig {
    /**
     * Prefix to be added to all cookie names. By default "aura-stack".
     */
    prefix?: string
    overrides?: Partial<CookieStoreConfig>
}

/**
 * A trusted origin URL or pattern. Supports:
 * - Exact: `https://example.com`
 * - Subdomain wildcard: `https://*.example.com`
 */
export type TrustedOrigin = string

/**
 * Log level for logger messages.
 */
export type LogLevel = "warn" | "error" | "debug" | "info"

/** Defines the Severity between 0 to 7 */
export type Severity = "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug"

/**
 * @see https://datatracker.ietf.org/doc/html/rfc5424
 */
export type SyslogOptions = {
    facility: 4 | 10
    severity: Severity
    timestamp?: string
    hostname?: string
    appName?: string
    procId?: string
    msgId: string
    message: string
    structuredData?: Record<string, string | number | boolean>
}

/**
 * Logger function interface for structured logging.
 * Called when errors or warnings occur during authentication flows.
 */
export interface Logger {
    level?: LogLevel
    log?: (args: SyslogOptions) => void
}

export type AuthAPI = ReturnType<typeof createAuthAPI>
export type JoseInstance<DefaultUser extends User = User> = ReturnType<typeof createJoseInstance<DefaultUser>>

export interface InternalLogger {
    level: LogLevel
    log: typeof createLogEntry
}

export interface RouterGlobalContext<DefaultUser extends User = User> {
    oauth: OAuthProviderRecord
    cookies: CookieStoreConfig
    jose: JoseInstance<DefaultUser>
    secret?: JWTKey
    baseURL?: string
    basePath: string
    trustedProxyHeaders: boolean
    trustedOrigins?: TrustedOrigin[] | ((request: Request) => Promise<TrustedOrigin[]> | TrustedOrigin[])
    logger?: InternalLogger
    sessionStrategy: SessionStrategy<DefaultUser>
}

/**
 * Internal runtime configuration used within Aura Auth after initialization.
 * All optional fields from AuthConfig are resolved to their default values.
 */
export type AuthRuntimeConfig<DefaultUser extends User = User> = RouterGlobalContext<DefaultUser>

export interface AuthInstance<DefaultUser extends User = User> {
    api: AuthAPI
    jose: JoseInstance<DefaultUser>
    handlers: {
        GET: (request: Request) => Response | Promise<Response>
        POST: (request: Request) => Response | Promise<Response>
        ALL: (request: Request) => Response | Promise<Response>
    }
}

export type InternalContext<DefaultUser extends User = User> = RouterGlobalContext<DefaultUser> & {
    cookieConfig: {
        secure: CookieStoreConfig
        standard: CookieStoreConfig
    }
}
