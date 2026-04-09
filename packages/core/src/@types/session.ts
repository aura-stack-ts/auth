import { EditableShape, Prettify, ShapeToObject } from "./utility.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { UserIdentityType, UserShape } from "@/shared/identity.ts"
import type {
    CookieStoreConfig,
    CredentialsPayload,
    IdentityConfig,
    InternalLogger,
    JoseInstance,
    RouterGlobalContext,
} from "@/@types/config.ts"

export type User = UserIdentityType
export type { UserShape } from "@/shared/identity.ts"

/**
 * Session data returned by the session endpoint.
 */
export interface Session<DefaultUser extends User = User> {
    user: DefaultUser
    expires: string
}

/**
 * A symmetric secret or asymmetric key pair used for JWT operations.
 *
 * - string / Uint8Array: used as-is for HMAC (signed) or AES (encrypted)
 * - CryptoKey: Web Crypto API key, for environments that support it
 * - KeyPair: asymmetric signing (RS256, ES256, EdDSA, etc.)
 */
export type SecretKey = string | Uint8Array | CryptoKey

export interface KeyPair {
    privateKey: CryptoKey
    publicKey: CryptoKey
}

/**
 * @todo: add key rotation support for "SecretKey | KeyPair | [SecretKey | KeyPair, ...(SecretKey | KeyPair)[]]"
 */
export type JWTKey = SecretKey

/**
 * - "signed"    → standard JWS (e.g. HS256, RS256, ES256).
 * - "encrypted" → JWE only. (e.g. A256GCM with RSA-OAEP key wrapping).
 * - "sealed"    → JWS nested inside JWE (signed then encrypted).
 */
export type JWTMode = "signed" | "encrypted" | "sealed"

/**
 * Signing algorithms for "signed" and "sealed" modes.
 * Symmetric: HS256 | HS384 | HS512
 * Asymmetric: RS256 | RS384 | RS512 | ES256 | ES384 | ES512 | EdDSA | PS256
 */
export type JWTSigningAlgorithm =
    | "HS256"
    | "HS384"
    | "HS512"
    | "RS256"
    | "RS384"
    | "RS512"
    | "ES256"
    | "ES384"
    | "ES512"
    | "EdDSA"
    | "PS256"

/**
 * Key-wrapping algorithms for "encrypted" and "sealed" modes.
 * Symmetric: A128KW | A192KW | A256KW | dir (direct)
 * ECDH:      ECDH-ES | ECDH-ES+A128KW | ECDH-ES+A256KW
 * RSA:       RSA-OAEP | RSA-OAEP-256
 */
export type JWTKeyAlgorithm =
    | "A128KW"
    | "A192KW"
    | "A256KW"
    | "dir"
    | "ECDH-ES"
    | "ECDH-ES+A128KW"
    | "ECDH-ES+A256KW"
    | "RSA-OAEP"
    | "RSA-OAEP-256"

/** Content-encryption algorithms for JWE. */
export type JWTEncryptionAlgorithm = "A128CBC-HS256" | "A192CBC-HS384" | "A256CBC-HS512" | "A128GCM" | "A192GCM" | "A256GCM"

/** Signed JWT mode configuration. */
export type JWTSignedMode = {
    mode: "signed"
    signingAlgorithm?: JWTSigningAlgorithm
}

/** Encrypted JWT mode configuration. */
export type JWTEncryptedMode = {
    mode: "encrypted"
    keyAlgorithm?: JWTKeyAlgorithm
    encryptionAlgorithm?: JWTEncryptionAlgorithm
}

/** Signed and Encrypted JWT mode configuration. */
export type JWTSealedMode = {
    mode?: "sealed"
    signingAlgorithm?: JWTSigningAlgorithm
    keyAlgorithm?: JWTKeyAlgorithm
    encryptionAlgorithm?: JWTEncryptionAlgorithm
}

export type JWTConfigBase = JWTSignedMode | JWTEncryptedMode | JWTSealedMode

export type JWTExpirationStrategy = "fixed" | "rolling" | "absolute" | "sliding"

export type JWTConfig = {
    /**
     * Token lifetime.
     */
    maxAge?: number
    /**
     * JWT `iss` (issuer) claim. Set this to your app's canonical URL.
     * @example "https://auth.example.com"
     */
    issuer?: string
    /**
     * JWT `aud` claim. Single value or array for multi-audience tokens.
     * @example ["https://api.example.com", "https://app.example.com"]
     */
    audience?: string | string[]
    /**
     * Maximum absolute session duration in seconds.
     * Required for "absolute" and "sliding" strategies.
     * Enforced via jose's maxTokenAge against the iat claim.
     */
    maxExpiration?: number
    /**
     *
     */
    expirationStrategy?: JWTExpirationStrategy
} & JWTConfigBase

/**
 * Stateless JWT strategy.
 * No database required. Tokens are self-contained and cannot be revoked
 * before they expire — keep `jwt.maxAge` short or enable refresh tokens.
 *
 * @example
 * {
 *   strategy: "jwt",
 *   jwt: { mode: "sealed", maxAge: "15m", issuer: "https://auth.example.com" },
 *   refreshToken: { enabled: true, maxAge: "7d" },
 * }
 */
export type StatelessStrategyConfig = {
    strategy?: "jwt"
    jwt?: JWTConfig
}

/**
 * The session strategy. Determines which fields below are required.
 *
 * - "jwt": stateless. No database needed. JWTs are self-contained.
 * - "database": stateful. Every request hits the DB to validate the session.
 * - "hybrid": JWT transport + DB revocation. Best of both for most apps.
 *
 * @default "jwt"
 */
export type SessionConfig = StatelessStrategyConfig

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Abstraction layer for session management.
 */
export interface SessionStrategy<DefaultUser extends User = User> {
    /**
     * Read and validate the session from an incoming request.
     * Returns null if absent, invalid, or expired. Never throws on auth failure.
     */
    getSession(request: Headers): Promise<GetSessionReturn<DefaultUser>>

    /**
     * Create a session after successful authentication.
     * Signs the JWT / writes the DB row / sets cookies.
     */
    createSession(session: User): Promise<string>

    /**
     * Attempt to refresh using the refresh token cookie.
     * Returns null session + cookie-clearing response on any failure.
     */
    refreshSession(
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck?: boolean
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }>

    /**
     * Revoke a session by ID.
     * JWT strategy: best-effort (clears cookies, no server state).
     * Database / hybrid: marks row inactive.
     */
    revokeSession(sessionId: string): Promise<void>

    /**
     * Destroy the session attached to this request (logout).
     * Returns a response that clears cookies.
     */
    destroySession(request: Headers, skipCSRFCheck?: boolean): Promise<Headers>
}

export interface CreateSessionStrategyOptions<Identity extends EditableShape<UserShape>> {
    config?: SessionConfig
    jose: JoseInstance<ShapeToObject<Identity> & User>
    cookies: () => CookieStoreConfig
    logger?: InternalLogger
    identity: IdentityConfig
}

export interface JWTStrategyOptions<DefaultUser extends User = User> {
    config?: StatelessStrategyConfig
    jose: JoseInstance<DefaultUser>
    logger?: InternalLogger
    cookies: () => CookieStoreConfig
    identity: IdentityConfig
}

export type JWTManager<DefaultUser extends User = User> = {
    createToken(user: TypedJWTPayload<Partial<DefaultUser>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<DefaultUser>>
}

// #region API Types
export type FunctionAPIContext<Options extends object> = Prettify<
    {
        ctx: RouterGlobalContext
    } & Options
>

export interface SignInOptions {
    redirect?: boolean
    redirectTo?: string
}

export interface SignInAPIOptions<Redirect extends boolean = boolean> {
    headers?: HeadersInit
    redirect?: Redirect
    redirectTo?: string
    request?: Request
}

export type SignInReturn<Redirect extends boolean = boolean> = Redirect extends true
    ? Response
    : { redirect: false; signInURL: string }

export interface GetSessionReturn<DefaultUser extends User = User> {
    session: Session<DefaultUser> | null
    headers: Headers
}

export interface GetSessionAPIOptions {
    headers: HeadersInit
}

export type SessionResponse<DefaultUser extends User = User> =
    | { session: Session<DefaultUser>; headers: Headers; authenticated: true }
    | { session: null; headers: Headers; authenticated: false }

export interface SignOutOptions {
    redirect?: boolean
    redirectTo?: string
}

export interface SignOutAPIOptions {
    headers: HeadersInit
    redirectTo?: string
    skipCSRFCheck?: boolean
}

export interface UpdateSessionAPIOptions<DefaultUser extends User = User> {
    headers: HeadersInit
    session: DeepPartial<Session<DefaultUser>>
    skipCSRFCheck?: boolean
}

export type UpdateSessionReturn<DefaultUser extends User = User> =
    | { session: Session<DefaultUser>; headers: Headers; updated: true }
    | { session: null; headers: Headers; updated: false }

export type SignInCredentialsOptions = FunctionAPIContext<{
    payload: CredentialsPayload
    request?: Request
    headers?: HeadersInit
    redirectTo?: string
}>

export interface SignInCredentialsAPIOptions {
    payload: CredentialsPayload
    request?: Request
    headers?: HeadersInit
    redirect?: boolean
    redirectTo?: string
}

export type SignInCredentialsReturn =
    | { success: true; headers: Headers; redirectURL: string }
    | { success: false; headers: Headers; redirectURL?: null }
