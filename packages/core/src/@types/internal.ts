/**
 * This file contains internal types used by the library to avoid exposing internal
 * types to the public API. This manuall solution was proposed because the current version
 * of tsdown does not support stripping internal types.
 */
import type { Awaitable, InferSchema, Prettify, RoutePattern } from "@aura-stack/router"
import type { ZodObject, infer as Infer } from "zod"
import type { AuthResponse, DeepPartial, LiteralUnion } from "@/@types/utility.ts"
import type { identitySchema } from "@/identity/zod.ts"
import type { createLogEntry } from "@/config/logger/create-logger.ts"
import type { InferRules } from "@aura-stack/rate-limiter"
import type { createSchemaRegistry } from "@/validator/registry.ts"
import type { FromShapeToObject, Identities, SchemaTypes } from "@/identity/index.ts"
import type { AccessTokenContext, BuiltInOAuthProvider, OAuthProviderConfig, OAuthProviderCredentials } from "@/@types/oauth.ts"
import type {
    CookieName,
    CookieStrategyAttributes,
    CredentialsConfig,
    EmailChangeConfig,
    EmailVerificationConfig,
    JoseInstance,
    LogLevel,
    MagicLinksConfig,
    PasswordResetConfig,
    RateLimiterConfig,
    SignUpConfig,
    TrustedOrigin,
    TrustedProxyHeadersSource,
} from "@/@types/config.ts"
import type {
    JWTKey,
    OAuthTokenPayload,
    Session,
    SessionConfig,
    StatefulStrategyConfig,
    StatelessStrategyConfig,
    User,
} from "@/@types/session.ts"
import type { OAuthAccessTokenResponse, OIDCAccessTokenResponseSchema } from "@/shared/schemas/general.ts"
import type { JWTPayload } from "@/jose.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { SessionWithUserEntity } from "@/@types/entities.ts"
import type { createCookieManager } from "@/session/cookie-manager.ts"
import type { createClient } from "@/client/client.ts"
import type { AuthClient } from "./client.ts"

/**
 * Runtime context passed into auth actions and API handlers: OAuth map, cookies, JWT, session strategy, trusted origins, etc.
 * This is the fully resolved configuration surface after `createAuth` initializes defaults.
 */
export interface RouterGlobalContext<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = ZodObject<any>> {
    oauth: OAuthProviderRecord<DefaultUser>
    credentials?: CredentialsConfig<any>
    cookies: InternalCookieConfig
    jose: InternalJoseConfig<DefaultUser>
    secret?: JWTKey
    baseURL?: string
    basePath: RoutePattern
    trustedProxyHeaders: boolean | TrustedProxyHeadersSource[]
    trustedOrigins?: TrustedOrigin[] | ((request: Request) => Promise<TrustedOrigin[]> | TrustedOrigin[])
    logger?: InternalLogger
    session: InternalSessionConfig<DefaultUser>
    identity: SchemaRegistryContext
    signUp?: SignUpConfig<DefaultUser, SignUpSchema>
    rateLimiters: InferRules<Required<RateLimiterConfig>>
    emailVerification?: EmailVerificationConfig
    passwordReset?: PasswordResetConfig
    emailChange?: EmailChangeConfig
    magicLinks?: MagicLinksConfig
}

export interface SchemaRegistryContext {
    schemaRegistry: ReturnType<typeof createSchemaRegistry>
    skipValidation?: boolean
    unknownKeys: "passthrough" | "strict" | "strip"
}

export type InternalSessionConfig<DefaultUser extends User, Config extends SessionConfig = SessionConfig> = {
    config: Config
    strategy: SessionStrategy<DefaultUser>
}

export type InternalContext<Identity extends Identities, SignUpSchema extends SchemaTypes> = RouterGlobalContext<
    FromShapeToObject<Identity>,
    SignUpSchema
>

export type InternalContextForStateful = RouterGlobalContext<any, any> & {
    session: InternalSessionConfig<User, StatefulStrategyConfig>
}

export type InternalContextForStateless = RouterGlobalContext<any, any> & {
    session: InternalSessionConfig<User, StatelessStrategyConfig>
}

export type InternalExpirationResult =
    | { action: "no_change" }
    | { action: "extend"; expiresAt: Date }
    | { action: "touch" }
    | { action: "invalid" }

export type CustomUserInfoFunction = Extract<OAuthProviderConfig["userInfo"], { request: (context: AccessTokenContext) => any }>

/**
 * Context provided to the credentials provider's authorize function.
 * It includes the credentials sent by the user and hashing utilities.
 */
export interface CredentialsConfigContext<T> {
    /**
     * User-provided credentials (e.g., email, password).
     */
    credentials: T
    /**
     * Hashes a password using the internal hashing algorithm (PBKDF2).
     */
    deriveSecret: (password: string, salt?: string, iterations?: number) => Awaitable<string>
    /**
     * Verifies a password against a hashed value.
     */
    verifySecret: (password: string, hashedPassword: string) => Awaitable<boolean>
}

export interface OnCreateUserContext<Schema extends SchemaTypes> {
    payload: InferSchema<Schema>
}

/** Minimal token issue/verify surface used by session code paths. */
export type JoseManager<DefaultUser extends User = User> = {
    createToken(user: TypedJWTPayload<Partial<DefaultUser>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<DefaultUser>>
}

export interface InternalCookieConfig {
    store: InternalCookieStoreConfig
    precomputed: {
        trusted: InternalCookieStoreConfig
        untrusted: InternalCookieStoreConfig
    }
    manager: CookieManager
}

export interface InternalJoseConfig<DefaultUser extends User = User> {
    instance: JoseInstance<DefaultUser>
    manager: JoseManager<DefaultUser>
}

// #region API
/**
 * Utility to merge the internal router global context (`ctx`) with per-function options.
 * Used by implementation-level API functions in `src/api/*`.
 */
export type FunctionAPIContext<Options extends object = {}> = Prettify<
    {
        ctx: RouterGlobalContext
    } & Options
>

/**
 * Canonical return shape for server/programmatic API functions.
 *
 * - Success branch includes the payload fields from `Body` plus response metadata.
 * - Failure branch includes `error` metadata and `toResponse()` for framework adapters.
 * - Both branches expose `headers` so callers can forward cookies and auth-related headers.
 */
export type AuthActionAPIReturn<Body extends object, ErrorCodes = any> =
    | (Extract<Body, { success: true }> & { headers: Headers; toResponse: () => AuthResponse<Exclude<Body, { success: false }>> })
    | (Extract<Body, { success: false }> & {
          success: false
          headers: Headers
          /** @todo: Add `docs` property */
          error: { code: ErrorCodes; message: string }
          toResponse: () => AuthResponse<Exclude<Body, { success: true }>>
      })

// #region Client

export type InternalAuthClient = ReturnType<typeof createClient>

// #region Config
export type InternalCookieStoreConfig = Record<CookieName, { name: string; attributes: CookieStrategyAttributes }>

/**
 * Normalized internal logger with resolved level and structured log function.
 */
export interface InternalLogger {
    level: LogLevel
    log: typeof createLogEntry
}

/**
 * Identity validation settings used when building session strategy and OAuth profile mapping.
 * Controls the Zod schema and how unknown keys are handled on user objects.
 */
export interface InternalIdentityConfig<Schema extends SchemaTypes = typeof identitySchema> {
    schema?: Schema
    schemaAsPartial?: Schema
    skipValidation?: boolean
    unknownKeys?: "passthrough" | "strict" | "strip"
}

// #region Session
export interface AsymmetricKeyPairFromEnv {
    publicKey: string
    privateKey: string
}

// #region OAuth/OIDC
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

/**
 * Lookup table of configured OAuth providers keyed by built-in id or custom id.
 * Values are full credential configs used at runtime for authorize/token/userinfo.
 */
export type OAuthProviderRecord<DefaultUser extends User = User> = Record<
    LiteralUnion<BuiltInOAuthProvider>,
    RuntimeOAuthProvider<any, DefaultUser>
>

// #region Jose
/**
 * JWT payload structure that includes a mandatory `token` field used to verify CSRF Tokens
 */
export type JWTPayloadWithToken = JWTPayload & { token: string }

export type CookieManager = ReturnType<typeof createCookieManager>

// #region Session Strategy
/**
 * Abstraction layer for session management.
 */
export interface SessionStrategy<DefaultUser extends User = User> {
    /**
     * Read and validate the session from an incoming request.
     * Returns null if absent, invalid, or expired. Never throws on auth failure.
     */
    getSession(options: { headers: Headers }): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }>
    /**
     * Create a session after successful authentication.
     * Signs the JWT / writes the DB row / sets cookies.
     */
    createSession(options: { session: User; request: Request }): Promise<string>
    /**
     * Get the OAuth access token for a specific provider, using the refresh token if necessary.
     */
    getProviderTokens(options: {
        oauthId: string
        request: Request
        provider: RuntimeOAuthProvider<any, DefaultUser>
        sessionByToken: SessionWithUserEntity
    }): Promise<{ tokens: OAuthTokenPayload; headers: Headers }>
    /**
     * Attempt to refresh using the refresh token cookie.
     * Returns null session + cookie-clearing response on any failure.
     */
    refreshSession(options: { headers: Headers; session: DeepPartial<Session<DefaultUser>> }): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }>
    /**
     * Revoke a session by ID.
     * JWT strategy: best-effort (clears cookies, no server state).
     * Database / hybrid: marks row inactive.
     */
    revokeSession(options: { sessionId: string }): Promise<void>
    /**
     * Destroy the session attached to this request (logout).
     * Returns a response that clears cookies.
     */
    destroySession(options: { sessionByToken: SessionWithUserEntity }): Promise<Headers>
    /**
     * Revoke the access token for a specific OAuth provider.
     * @unstable This API is experimental and may change in future releases.
     */
    revokeToken(options: {
        oauthId: string
        provider: RuntimeOAuthProvider<any, DefaultUser>
        headers: Headers
        disconnect: boolean
        sessionByToken: SessionWithUserEntity
    }): Promise<Headers>
    /**
     * Check if the user is connected to a specific OAuth provider.
     * @unstable This API is experimental and may change in future releases.
     */
    isProviderConnected(options: { oauthId: string; headers: Headers; sessionByToken: SessionWithUserEntity }): Promise<boolean>
    /**
     * Refresh the user info in the session.
     * @unstable This API is experimental and may change in future releases.
     */
    refreshUserInfo(options: { user: DeepPartial<DefaultUser>; headers: Headers; skipCSRFCheck?: boolean }): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }>
    /**
     * Sign up a new user with the given payload and request. Returns the session token on success.
     * @unstable This API is experimental and may change in future releases.
     */
    signUp(options: { payload: Record<string, unknown>; request: Request }): Promise<string>
    /**
     * Sign in a user with the given credentials and request. Returns the session token on success.
     * @unstable This API is experimental and may change in future releases.
     */
    signInCredentials(options: { payload: Record<string, unknown>; request: Request; redirectTo?: string }): Promise<string>
    /**
     * Sign in a user with the given OAuth provider and request. Returns the session token on success.
     */
    signIn(options: {
        oauthId: string
        provider: RuntimeOAuthProvider<any, DefaultUser>
        request: Request
        redirectTo?: string
    }): Promise<{
        success: boolean
        headers: Headers
        signInURL: string
    }>
    /**
     * Handle the OAuth callback after the user authorizes the app. Returns a response that
     *  sets cookies and redirects to the original URL.
     */
    oauthCallback(options: { oauthId: string; request: Request; params: { code: string; state: string } }): Promise<Response>
    /**
     *  Send a verification email to the user with a token and URL.
     */
    sendVerificationEmail(options: { email: string; origin: string }): Promise<{
        token: string
        url: string
    }>
    /**
     * Verify the email using the token sent to the user.
     */
    verifyEmail(options: { token: string }): Promise<void>
    /**
     * Initiate a password reset flow by sending an email with a token and URL. Returns the token and URL.
     */
    forgotPassword(options: { email: string; origin: string }): Promise<{
        token: string
        url: string
    }>
    /**
     * Reset the password using the token sent to the user.
     */
    resetPassword(options: { token: string; newPassword: string }): Promise<void>
    /**
     * Change the password for a user, given the current password and new password.
     */
    changePassword(options: { userId: string; currentPassword: string; newPassword: string }): Promise<void>
    /**
     * Initiate an email change flow by sending a confirmation email to the new address
     * and a cancellation email to the old address.
     */
    changeEmail(options: {
        userId: string
        currentPassword: string
        newEmail: string
        origin: string
    }): Promise<{ email: string; confirmToken: string; confirmURL: string; cancelToken: string; cancelURL: string }>
    /**
     * Verify the email change request using the token sent to the user.
     */
    verifyEmailChange(options: { token: string; userId: string; sessionId: string }): Promise<void>
    /**
     * Cancel the email change request using the token sent to the user.
     */
    cancelEmailChange(options: { token: string; userId?: string } | { token?: string; userId: string }): Promise<void>
    /**
     * Initiates the magic link sign-in or sign-up flow by sending an email with a token and URL.
     */
    sendMagicLink(options: { email: string; allowSignUp: boolean; origin: string }): Promise<{ token: string; url: string }>
    /**
     * Verivy the magic link token
     */
    verifyMagicLink(options: { token: string; request: Request }): Promise<{ sessionToken: string }>
}
