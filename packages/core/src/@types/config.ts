import { createJoseInstance } from "@/jose.ts"
import { createAuthAPI } from "@/api/createApi.ts"
import { createLogEntry } from "@/shared/logger.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { UserIdentity, type Identities, type SchemaTypes } from "@/shared/identity.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { SerializeOptions } from "@aura-stack/router/cookie"
import type { ConfigSchema, FromShapeToObject, Prettify } from "@/@types/utility.ts"
import type { OAuthProviderCredentials, OAuthProviderRecord } from "@/@types/oauth.ts"
import type { JWTKey, SessionConfig, SessionStrategy, User } from "@/@types/session.ts"

/**
 * Main configuration interface for Aura Auth.
 * This is the user-facing configuration object passed to `createAuth()`.
 */
export interface AuthConfig<Identity extends Identities> {
    /**
     * OAuth providers available in the authentication and authorization flows. It provides a type-inference
     * for the OAuth providers that are supported by Aura Stack Auth; alternatively, you can provide a custom
     * OAuth third-party authorization service by implementing the `OAuthProviderCredentials` interface.
     *
     * Built-in OAuth providers:
     * ```ts
     * oauth: ["github", "google"]
     * ```
     * Custom credentials via factory:
     * ```ts
     * oauth: [github({ clientId: "...", clientSecret: "..." })]
     * ```
     * Custom OAuth providers:
     * ```ts
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
     * ```
     */
    // @todo: add type inference for built-in providers
    oauth: (BuiltInOAuthProvider | OAuthProviderCredentials<any, FromShapeToObject<Identity>>)[]
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
     *
     * > It can be a string, a Uint8Array, a CryptoKey, a CryptoKeyPair, or an object containing separate keys for
     * signing and encryption. It depends on the JWT mode and algorithms you choose in the session configuration.
     * The default mode is "sealed" (signing + encryption), so if the secret is a string or Uint8Array, it will derive
     * separate keys for signing and encryption using HKDF, but if you provide a CryptoKeyPair, it will required to
     * pass separate keys for signing and encryption in the `CryptoSecret` format.
     * @example
     * import { createSecretValue } from "@aura-stack/auth/crypto"
     *
     * secret: createSecretValue(32)
     *
     * // For asymmetric keys, generate a key pair and pass the private
     * import { createKeyPair } from "@aura-stack/auth/crypto"
     *
     * const signing = await createKeyPair("RS256", { extractable: true })
     * const encryption = await createKeyPair("RSA-OAEP-256", { extractable: true })
     *
     * secret: {
     *   sign: signing,
     *   encrypt: encryption,
     * }
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

    /**
     * Identity schema configuration for user data validation.
     * Allows you to define a custom Zod schema that will be used to validate:
     * - OAuth provider profile data
     * - Session user data
     * - JWT payload data
     *
     * If not provided, the default `UserIdentity` schema will be used.
     *
     * @example
     * identity: {
     *   schema: z.object({
     *     sub: z.string(),
     *     email: z.string().email(),
     *     name: z.string().optional(),
     *     custom_field: z.string().optional(),
     *   }),
     *   skipValidation: false,
     *   unknownKeys: "strip",
     * }
     */
    identity?: Partial<{
        skipValidation: boolean
        schema: ConfigSchema<Identity>
        unknownKeys: "passthrough" | "strict" | "strip"
    }>
    /**
     * Credentials provider for username/password or similar authentication.
     */
    credentials?: CredentialsProvider<Identity>
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

/** Resolved cookie names and serialization attributes for each logical auth cookie. */
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

/**
 * Programmatic auth API returned with the auth instance: `getSession`, `signIn`, `signInCredentials`, `signOut`, `updateSession`.
 * Each method returns a result object plus `headers` and `toResponse()` for HTTP responses.
 */
export type AuthAPI<DefaultUser extends User = User> = ReturnType<typeof createAuthAPI<DefaultUser>>

/** JWT and crypto helpers bound to the configured identity schema (sign, verify, claims). */
export type JoseInstance<DefaultUser extends User = User> = ReturnType<typeof createJoseInstance<DefaultUser>>

/** Normalized internal logger with resolved level and structured log function. */
export interface InternalLogger {
    level: LogLevel
    log: typeof createLogEntry
}

/**
 * Identity validation settings used when building session strategy and OAuth profile mapping.
 * Controls the Zod schema and how unknown keys are handled on user objects.
 */
export interface IdentityConfig<Schema extends SchemaTypes = typeof UserIdentity> {
    schema?: Schema
    schemaAsPartial?: Schema
    skipValidation?: boolean
    unknownKeys?: "passthrough" | "strict" | "strip"
}

/** Payload sent to the credentials sign-in endpoint (username/password flow). */
export interface CredentialsPayload {
    username: string
    password: string
}

/**
 * Context provided to the credentials provider's authorize function.
 * It includes the credentials sent by the user and hashing utilities.
 */
export interface CredentialsProviderContext<T> {
    /**
     * User-provided credentials (e.g., email, password).
     */
    credentials: T
    /**
     * Hashes a password using the internal hashing algorithm (PBKDF2).
     */
    deriveSecret: (password: string, salt?: string, iterations?: number) => Promise<string>
    /**
     * Verifies a password against a hashed value.
     */
    verifySecret: (password: string, hashedPassword: string) => Promise<boolean>
}

/**
 * Interface for the credentials provider.
 */
export interface CredentialsProvider<Identity extends Identities> {
    hash?: (password: string, salt?: string, iterations?: number) => Promise<string>
    verify?: (password: string, hashedPassword: string) => Promise<boolean>
    /**
     * Authenticates a user using credentials.
     * Must return a User object or the identity type if the identity schema is provided.
     */
    authorize: (
        ctx: CredentialsProviderContext<CredentialsPayload>
    ) => Promise<FromShapeToObject<Identity> | null> | FromShapeToObject<Identity> | null
}

/**
 * Runtime context passed into auth actions and API handlers: OAuth map, cookies, JWT, session strategy, trusted origins, etc.
 * This is the fully resolved configuration surface after `createAuth` initializes defaults.
 */
export interface RouterGlobalContext<DefaultUser extends User = User> {
    oauth: OAuthProviderRecord
    credentials?: CredentialsProvider<any>
    cookies: CookieStoreConfig
    jose: JoseInstance<DefaultUser>
    secret?: JWTKey
    baseURL?: string
    basePath: string
    trustedProxyHeaders: boolean
    trustedOrigins?: TrustedOrigin[] | ((request: Request) => Promise<TrustedOrigin[]> | TrustedOrigin[])
    logger?: InternalLogger
    sessionStrategy: SessionStrategy<DefaultUser>
    identity: SchemaRegistryContext
}

export interface SchemaRegistryContext {
    schemaRegistry: ReturnType<typeof createSchemaRegistry>
    skipValidation?: boolean
    unknownKeys: "passthrough" | "strict" | "strip"
}

/**
 * Internal runtime configuration used within Aura Auth after initialization.
 * All optional fields from AuthConfig are resolved to their default values.
 */
export type AuthRuntimeConfig<DefaultUser extends User = User> = RouterGlobalContext<DefaultUser>

/**
 * Public auth instance: programmatic {@link AuthAPI}, {@link JoseInstance}, and HTTP {@link AuthClient} handlers.
 */
export interface AuthInstance<DefaultUser extends User = User> {
    api: AuthAPI<DefaultUser>
    jose: JoseInstance<DefaultUser>
    handlers: {
        GET: (request: Request) => Response | Promise<Response>
        POST: (request: Request) => Response | Promise<Response>
        PATCH: (request: Request) => Response | Promise<Response>
        ALL: (request: Request) => Response | Promise<Response>
    }
}

/**
 * Extended context used inside the library with both secure and standard cookie materializations.
 */
export type InternalContext<Identity extends Identities> = RouterGlobalContext<FromShapeToObject<Identity> & User> & {
    cookieConfig: {
        secure: CookieStoreConfig
        standard: CookieStoreConfig
    }
}
