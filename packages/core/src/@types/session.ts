import { identitySchema } from "@/identity/zod.ts"
import type { JWK } from "@aura-stack/jose/jose"
import type { infer as Infer } from "zod/v4/core"
import type { DatabaseAdapter } from "@/@types/adapter.ts"
import type { DeepPartial, Prettify } from "@/@types/index.ts"
import type { createCookieManager } from "@/session/cookie-manager.ts"

/** Application user type, inferred from the configured identity schema (defaults to the built-in user shape). */
export type User = Infer<typeof identitySchema>

export type { UserShape } from "@/identity/index.ts"

/**
 * Session data returned by the session endpoint.
 */
export interface Session<DefaultUser extends User = User> {
    user: DefaultUser
    expires: string
}

export interface CryptoSecret {
    sign: CryptoKey | CryptoKeyPair | JWK | JsonWebKey | AsymmetricKeyPair
    encrypt: CryptoKey | CryptoKeyPair | JWK | JsonWebKey | AsymmetricKeyPair
}

export interface AsymmetricKeyPairFromEnv {
    publicKey: string
    privateKey: string
}

export interface AsymmetricKeyPair {
    publicKey: CryptoKey | JWK
    privateKey: CryptoKey | JWK
}

/**
 * A symmetric secret or asymmetric key pair used for JWT operations.
 *
 * - string / Uint8Array: used as-is for HMAC (signed) or AES (encrypted)
 * - CryptoKey: Web Crypto API key, for environments that support it
 * - CryptoKeyPair: asymmetric signing/encryption (RS256, ES256, EdDSA, RSA-OAEP, etc.)
 */
export type SecretKey = string | Uint8Array | CryptoKey | CryptoKeyPair | CryptoSecret | JWK | AsymmetricKeyPair

/**
 * @todo: add key rotation support for "SecretKey | CryptoKeyPair | [SecretKey | CryptoKeyPair, ...(SecretKey | CryptoKeyPair)[]]"
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

/** Discriminated union of JWT wire format: signed JWS, encrypted JWE, or nested sealed (JWS in JWE). */
export type JWTConfigBase = JWTSignedMode | JWTEncryptedMode | JWTSealedMode

export type ExpirationStrategy = "fixed" | "rolling" | "absolute" | "sliding"

/**
 * How session/JWT lifetime is enforced relative to `iat`, absolute caps, and sliding windows.
 * @deprecated Use `ExpirationStrategy` instead. This will be removed in a future release.
 */
export type JWTExpirationStrategy = ExpirationStrategy

export type JWTConfig = Prettify<
    {
        /**
         * Token lifetime.
         * @deprecated Use `session.maxAge` instead. This will be removed in a future release.
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
         * @deprecated Use `session.maxDuration` instead. This will be removed in a future release.
         */
        maxExpiration?: number
        /**
         * Policy for renewing or capping token lifetime (pairs with `maxExpiration` where applicable).
         * @deprecated Use `session.expirationStrategy` instead. This will be removed in a future release.
         */
        expirationStrategy?: JWTExpirationStrategy
    } & JWTConfigBase
>

export interface SessionStatefulConfig {
    /**
     * The session deletion strategy when a user is deleted. Defaults to "soft" (mark as deleted, keep for audit).
     * - "soft": The user is marked as deleted, but the row is preserved in the database.
     * - "hard": The user and all associated data (Accounts, Sessions, Devices, MfaCredentials) are permanently removed from the database.
     */
    deleteStrategy?: "soft" | "hard"
    /**
     * The maximum number of concurrent sessions allowed per user. If exceeded, the oldest session(s) will be revoked.
     * If not set, there is no limit on concurrent sessions.
     */
    maxSessions?: number
}

export interface SessionConfigBase {
    /**
     * Session time to live (TTL) in seconds. Determines how long a session is valid before it expires.
     * If not set, the default is 15 days (60 * 60 * 24 * 15).
     * @default 1296000 (15 days)
     */
    maxAge?: number
    /**
     * Maximum absolute session duration in seconds.
     * Required for "absolute" and "sliding" strategies.
     * Enforced via jose's maxTokenAge against the iat claim.
     */
    maxDuration?: number
    /**
     * The session expiration strategy. Determines how the session's lifetime is calculated and enforced.
     * - "fixed": The session expires after a fixed duration from the time of creation.
     * - "rolling": The session expiration is extended on each request, up to the maximum age.
     * - "absolute": The session has a hard expiration time, regardless of activity.
     * - "sliding": The session expiration is extended on each request, but cannot exceed the maximum expiration time.
     *
     * @default "absolute"
     */
    expirationStrategy?: JWTExpirationStrategy
}

/**
 * Stateless JWT strategy.
 * No database required. Tokens are self-contained and cannot be revoked
 * before they expire — keep `jwt.maxAge` short or enable refresh tokens.
 *
 * @example
 * {
 *   strategy: "jwt",
 *   jwt: { mode: "sealed", issuer: "https://auth.example.com" },
 * }
 */
export interface StatelessStrategyConfig extends SessionConfigBase {
    strategy?: "jwt"
    jwt?: JWTConfig
}

/**
 * Stateful database strategy.
 * Database required. Every request hits the DB to validate the session.
 *
 * @example
 * {
 *   strategy: "database",
 *   adapter: prismaAdapter({ client: prismaClient }),
 *   database: { deleteStrategy: "soft", maxSessions: 5 },
 * }
 */
export interface StatefulStrategyConfig extends SessionConfigBase {
    strategy: "database"
    adapter: DatabaseAdapter
    database?: SessionStatefulConfig
    /**
     * @deprecated Use `database` instead. This will be removed in a future release.
     */
    session?: SessionStatefulConfig
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
export type SessionConfig = StatelessStrategyConfig | StatefulStrategyConfig

/** Result of reading a stateless (JWT) session from a request: session payload and outgoing header mutations. */
export interface GetStatelessSessionReturn<DefaultUser extends User = User> {
    session: Session<DefaultUser> | null
    headers: Headers
}

export type GetStatefulSessionReturn<DefaultUser extends User = User> = GetStatelessSessionReturn<DefaultUser>

export type GetProviderTokensStatefulReturn =
    | { success: true; tokens: OAuthTokenPayload; headers: Headers }
    | { success: false; tokens: null; error: { code: string; message: string }; headers: Headers; statusCode: number }

/**
 * Abstraction layer for session management.
 */
export interface SessionStrategy<DefaultUser extends User = User> {
    /**
     * Read and validate the session from an incoming request.
     * Returns null if absent, invalid, or expired. Never throws on auth failure.
     */
    getSession(headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>>

    /**
     * Create a session after successful authentication.
     * Signs the JWT / writes the DB row / sets cookies.
     */
    createSession(session: User, request: Request): Promise<string>

    getProviderTokens(oauth: string, request: Request): Promise<GetProviderTokensStatefulReturn>

    /**
     * Attempt to refresh using the refresh token cookie.
     * Returns null session + cookie-clearing response on any failure.
     */
    refreshSession(
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean
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
    destroySession(headers: Headers, skipCSRFCheck?: boolean): Promise<Headers>

    /**
     * Revoke the access token for a specific OAuth provider.
     * @unstable This API is experimental and may change in future releases.
     */
    revokeToken(oauth: string, headers: Headers, disconnect: boolean): Promise<Headers>

    /**
     * Check if the user is connected to a specific OAuth provider.
     * @unstable This API is experimental and may change in future releases.
     */
    isProviderConnected(oauth: string, headers: Headers): Promise<boolean>

    /**
     * Refresh the user info in the session.
     * @unstable This API is experimental and may change in future releases.
     */
    refreshUserInfo(
        user: Partial<DefaultUser>,
        headers: Headers,
        skipCSRFCheck?: boolean
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }>

    /**
     * Sign up a new user with the given payload and request. Returns the session token on success.
     * @unstable This API is experimental and may change in future releases.
     */
    signUp(payload: Record<string, unknown>, request: Request): Promise<string>
    /**
     * Sign in a user with the given credentials and request. Returns the session token on success.
     * @unstable This API is experimental and may change in future releases.
     */
    signInCredentials(payload: Record<string, unknown>, request: Request, redirectTo?: string): Promise<string>
    signIn(
        oauth: string,
        request: Request,
        redirectTo?: string
    ): Promise<{
        success: boolean
        headers: Headers
        signInURL: string
    }>

    oauthCallback(oauth: string, request: Request, { code, state }: { code: string; state: string }): Promise<Response>
}

export interface OAuthTokenPayload {
    /**
     * The raw access token string issued by the OAuth provider.
     */
    accessToken: string
    /**
     * The expiration time of the access token, in seconds since the epoch (Unix time).
     * @deprecated
     */
    expiresAt: number
    accessTokenExpiresAt?: number
    /**
     * The raw refresh token string issued by the OAuth provider, if applicable.
     */
    refreshToken?: string
    /**
     * The expiration time of the refresh token, in seconds since the epoch (Unix time).
     */
    refreshTokenExpiresAt?: number
    /**
     * The raw ID token string issued by the OIDC provider. Only supported by OIDC-compliant providers.
     */
    idToken?: string
    /**
     * The type of token issued by the OAuth provider. Typically "Bearer" for OAuth 2.0.
     */
    tokenType: "Bearer"
    /**
     * The scopes granted to the access token, as an array of strings. These define the permissions the token has.
     */
    scopes: string[]
    /**
     * The issuer of the token, typically the OAuth provider's URL. This is used to validate the token's authenticity.
     */
    issuer?: string
    /**
     * The time at which the token was issued, in seconds since the epoch (Unix time).
     */
    issuedAt: number
}

export type CookieManager = ReturnType<typeof createCookieManager>
