/**
 * This file contains internal types used by the library to avoid exposing internal
 * types to the public API. This manuall solution was proposed because the current version
 * of tsdown does not support stripping internal types.
 */
import type { InferSchema, Prettify } from "@aura-stack/router"
import type { ZodObject, infer as Infer } from "zod"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { identitySchema } from "@/identity/zod.ts"
import type { createLogEntry } from "@/shared/logger.ts"
import type { InferRules } from "@aura-stack/rate-limiter"
import type { createSchemaRegistry } from "@/validator/registry.ts"
import type { FromShapeToObject, Identities, SchemaTypes } from "@/identity/index.ts"
import type { AccessTokenContext, BuiltInOAuthProvider, OAuthProviderConfig, OAuthProviderCredentials } from "@/@types/oauth.ts"
import type {
    CookieName,
    CookieStrategyAttributes,
    CredentialsConfig,
    JoseInstance,
    JWTManager,
    LogLevel,
    RateLimiterConfig,
    SignUpConfig,
    TrustedOrigin,
} from "@/@types/config.ts"
import type {
    CookieManager,
    JWTKey,
    SessionConfig,
    SessionStrategy,
    StatefulStrategyConfig,
    StatelessStrategyConfig,
    User,
} from "@/@types/session.ts"
import type { OAuthAccessTokenResponse, OIDCAccessTokenResponseSchema } from "@/schemas.ts"

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

/**
 * Runtime context passed into auth actions and API handlers: OAuth map, cookies, JWT, session strategy, trusted origins, etc.
 * This is the fully resolved configuration surface after `createAuth` initializes defaults.
 */
export interface RouterGlobalContext<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = ZodObject<any>> {
    oauth: OAuthProviderRecord<DefaultUser>
    credentials?: CredentialsConfig<any>
    cookies: InternalCookieStoreConfig
    jose: JoseInstance<DefaultUser>
    secret?: JWTKey
    baseURL?: string
    basePath: string
    trustedProxyHeaders: boolean
    trustedOrigins?: TrustedOrigin[] | ((request: Request) => Promise<TrustedOrigin[]> | TrustedOrigin[])
    logger?: InternalLogger
    sessionStrategy: SessionStrategy<DefaultUser>
    identity: SchemaRegistryContext
    signUp?: SignUpConfig<DefaultUser, SignUpSchema>
    jwtManager: JWTManager<DefaultUser>
    rateLimiters: InferRules<Required<RateLimiterConfig>>
    sessionConfig: SessionConfig
}

export interface SchemaRegistryContext {
    schemaRegistry: ReturnType<typeof createSchemaRegistry>
    skipValidation?: boolean
    unknownKeys: "passthrough" | "strict" | "strip"
}

export type InternalContext<Identity extends Identities, SignUpSchema extends SchemaTypes> = RouterGlobalContext<
    FromShapeToObject<Identity>,
    SignUpSchema
> & {
    cookieConfig: {
        secure: InternalCookieStoreConfig
        standard: InternalCookieStoreConfig
    }
}

export type InternalContextForStateful = Omit<InternalContext<any, any>, "sessionConfig"> & {
    sessionConfig: StatefulStrategyConfig
}

export interface CreateSessionStrategyOptions<Identity extends Identities> {
    ctx: InternalContext<Identity, any>
    cookies: () => InternalCookieStoreConfig
}

export interface InternalSessionContext<Ctx> {
    ctx: Ctx
    cookies: () => InternalCookieStoreConfig
    cookieManager: CookieManager
}

export type InternalStatefulContext = InternalSessionContext<InternalContextForStateful>

export type InternalStatelessContext = InternalSessionContext<InternalContextForStateless>

export type InternalContextForStateless = Omit<InternalContext<any, any>, "sessionConfig"> & {
    sessionConfig: StatelessStrategyConfig
}

export type InternalExpirationResult =
    | { action: "no_change" }
    | { action: "extend"; expiresAt: Date }
    | { action: "touch" }
    | { action: "invalid" }

export type CustomUserInfoFunction = Extract<OAuthProviderConfig["userInfo"], { request: (context: AccessTokenContext) => any }>

/**
 * Internal runtime configuration used within Aura Auth after initialization.
 * All optional fields from AuthConfig are resolved to their default values.
 */
export type AuthRuntimeConfig<DefaultUser extends User = User> = RouterGlobalContext<DefaultUser>

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
    deriveSecret: (password: string, salt?: string, iterations?: number) => Promise<string>
    /**
     * Verifies a password against a hashed value.
     */
    verifySecret: (password: string, hashedPassword: string) => Promise<boolean>
}

export interface OnCreateUserContext<Schema extends SchemaTypes> {
    payload: InferSchema<Schema>
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
