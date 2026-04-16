import { AuthResponse, DeepPartial, EditableShape, Prettify, ShapeToObject } from "./utility.ts"
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

/** Application user type, inferred from the configured identity schema (defaults to the built-in user shape). */
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

/** Asymmetric key pair for signing or key agreement (Web Crypto `CryptoKey` pair). */
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

/** Discriminated union of JWT wire format: signed JWS, encrypted JWE, or nested sealed (JWS in JWE). */
export type JWTConfigBase = JWTSignedMode | JWTEncryptedMode | JWTSealedMode

/** How session/JWT lifetime is enforced relative to `iat`, absolute caps, and sliding windows. */
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
     * Policy for renewing or capping token lifetime (pairs with `maxExpiration` where applicable).
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

/** Result of reading a stateless (JWT) session from a request: session payload and outgoing header mutations. */
export interface GetStatelessSessionReturn<DefaultUser extends User = User> {
    session: Session<DefaultUser> | null
    headers: Headers
}

/**
 * Abstraction layer for session management.
 */
export interface SessionStrategy<DefaultUser extends User = User> {
    /**
     * Read and validate the session from an incoming request.
     * Returns null if absent, invalid, or expired. Never throws on auth failure.
     */
    getSession(request: Headers): Promise<GetStatelessSessionReturn<DefaultUser>>

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

/** Inputs for constructing a session strategy implementation for a given identity schema. */
export interface CreateSessionStrategyOptions<Identity extends EditableShape<UserShape>> {
    config?: SessionConfig
    jose: JoseInstance<ShapeToObject<Identity> & User>
    cookies: () => CookieStoreConfig
    logger?: InternalLogger
    identity: IdentityConfig
}

/** Options specialized for the JWT-backed session strategy. */
export interface JWTStrategyOptions<DefaultUser extends User = User> {
    config?: StatelessStrategyConfig
    jose: JoseInstance<DefaultUser>
    logger?: InternalLogger
    cookies: () => CookieStoreConfig
    identity: IdentityConfig
}

/** Minimal token issue/verify surface used by session code paths. */
export type JWTManager<DefaultUser extends User = User> = {
    createToken(user: TypedJWTPayload<Partial<DefaultUser>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<DefaultUser>>
}

// #region API/Client API Types

/**
 * Internal shape for auth API actions: success and failure variants include `headers` and `toResponse()`
 * for building {@link AuthResponse} bodies.
 */
type AuthActionAPIReturn<Body> =
    | (Extract<Body, { success: true }> & { headers: Headers; toResponse: () => AuthResponse<Exclude<Body, { success: false }>> })
    | (Extract<Body, { success: false }> & {
          success: false
          headers: Headers
          toResponse: () => AuthResponse<Exclude<Body, { success: true }>>
      })

/** Router context (`ctx`) merged with per-handler options (headers, body, redirect flags, etc.). */
export type FunctionAPIContext<Options extends object> = Prettify<
    {
        ctx: RouterGlobalContext
    } & Options
>

/** Options for reading the current session from request headers. */
export interface GetSessionOptions {
    headers: HeadersInit
}

/** Alias for {@link GetSessionOptions} when calling the programmatic `getSession` API. */
export type GetSessionAPIOptions = GetSessionOptions

/** Result of `getSession`: session payload on success, or `null` session with error semantics via `toResponse()`. */
export type GetSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<
    { success: true; session: Session<DefaultUser> } | { success: false; session: null }
>

/** Client-side OAuth sign-in options (browser): whether to navigate and optional post-login path. */
export interface SignInOptions<Redirect extends boolean = boolean> {
    redirect?: Redirect
    redirectTo?: string
}

/** Client `signIn` return: `void` when redirecting in-browser, otherwise a small JSON result with `signInURL`. */
export type SignInReturn<Redirect extends boolean = boolean> = Redirect extends true
    ? void
    : { success: boolean; redirect: false; signInURL: string | null }

/** Server/programmatic OAuth sign-in: optional `Request`, headers, and redirect behavior for the HTTP handler. */
export interface SignInAPIOptions {
    request?: Request
    headers?: HeadersInit
    redirect?: boolean
    redirectTo?: string
}

/**
 * Server `signIn` result: includes `signInURL` for both redirect and JSON flows, plus `toResponse()` for the route.
 * When `redirect` is true, the JSON body still carries the authorization URL for consistency.
 */
export type SignInAPIReturn =
    | {
          success: true
          redirect: true
          signInURL: string
          toResponse: () => AuthResponse<{ success: true; redirect: true; signInURL: string }>
      }
    | {
          success: true
          redirect: false
          signInURL: string
          toResponse: () => AuthResponse<{ success: true; redirect: false; signInURL: string }>
      }

/** Client credentials sign-in return: `void` on redirect, otherwise success with `redirectURL` or failure with `null`. */
export type SignInCredentialsReturn<Redirect extends boolean = boolean> = Redirect extends true
    ? void
    : { success: true; redirectURL: string } | { success: false; redirectURL: null }

/** Server credentials sign-in: credentials payload plus optional request/headers and post-login redirect target. */
export interface SignInCredentialsAPIOptions {
    payload: CredentialsPayload
    request?: Request
    headers?: HeadersInit
    redirectTo?: string
}

/** Result of credentials sign-in: success includes `redirectURL`; failure clears redirect with `null`. */
export type SignInCredentialsAPIReturn = AuthActionAPIReturn<
    { success: true; redirectURL: string } | { success: false; redirectURL: null }
>

/** Client-side sign-out options: optional redirect and destination path. */
export interface SignOutOptions<Redirect extends boolean = boolean> {
    redirect?: Redirect
    redirectTo?: string
}

/** Client `signOut` return: `void` when redirecting, otherwise JSON-like `{ success, redirectURL }`. */
export type SignOutReturn<Redirect extends boolean = boolean> = Redirect extends true
    ? void
    : { success: boolean; redirect: false; redirectURL: string }

/** Server sign-out: requires headers (cookies); optional redirect target and CSRF bypass for trusted callers. */
export interface SignOutAPIOptions {
    request?: Request
    headers: HeadersInit
    redirectTo?: string
    skipCSRFCheck?: boolean
}

/** Result of sign-out: success includes resolved `redirectURL`; failure uses `redirectURL: null`. */
export type SignOutAPIReturn = AuthActionAPIReturn<
    { success: true; redirectURL: string } | { success: false; redirectURL: null }
>

/** Partial session update accepted by the client (`updateSession`): user fields and/or expiry. */
export type UpdateSessionOptions<DefaultUser extends User = User> = DeepPartial<Session<DefaultUser>>

/** Client `updateSession` outcome: updated session or `null` on failure. */
export type UpdateSessionReturn<DefaultUser extends User = User> =
    | { success: true; session: Session<DefaultUser> }
    | { success: false; session: null }

/** Server `updateSession`: headers, partial session, optional CSRF bypass for same-origin server calls. */
export interface UpdateSessionAPIOptions<DefaultUser extends User = User> {
    headers: HeadersInit
    session: DeepPartial<Session<DefaultUser>>
    skipCSRFCheck?: boolean
}

/** Result of programmatic session refresh/update: current session on success, or `null` with failure response. */
export type UpdateSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<
    { success: true; session: Session<DefaultUser> } | { success: false; session: null }
>
