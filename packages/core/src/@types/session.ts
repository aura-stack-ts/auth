import type { DatabaseAdapter } from "@/@types/adapter.ts"

/** A duration expressed as seconds (number) or a human-readable string. */
export type Duration = number | `${number}s` | `${number}m` | `${number}h` | `${number}d` | `${number}w`

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

export type JWTKey = SecretKey | KeyPair | [SecretKey | KeyPair, ...(SecretKey | KeyPair)[]]

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
export type JwtKeyAlgorithm =
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
export type JwtEncryptionAlgorithm = "A128CBC-HS256" | "A192CBC-HS384" | "A256CBC-HS512" | "A128GCM" | "A192GCM" | "A256GCM"

/** Signed JWT mode configuration. */
export type JWTSignedMode = {
    mode: "signed"
    signingAlgorithm?: JWTSigningAlgorithm
}

/** Encrypted JWT mode configuration. */
export type JWTEncryptedMode = {
    mode: "encrypted"
    keyAlgorithm?: JwtKeyAlgorithm
    encryptionAlgorithm?: JwtEncryptionAlgorithm
}

/** Signed and Encrypted JWT mode configuration. */
export type JWTSealedMode = {
    mode?: "sealed"
    signingAlgorithm?: JWTSigningAlgorithm
    keyAlgorithm?: JwtKeyAlgorithm
    encryptionAlgorithm?: JwtEncryptionAlgorithm
}

export type JWTConfigBase = JWTSignedMode | JWTEncryptedMode | JWTSealedMode

export type JWTConfig = {
    /**
     * Token lifetime. After this duration the token is rejected regardless of
     * any database state. Defaults to "15m" for access tokens.
     */
    maxAge?: Duration
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
} & JWTConfigBase

/**
 * Detect and react to refresh token reuse — the primary signal for token theft.
 * When a used token is presented again:
 *   - "revoke_family": revoke all tokens in the rotation chain (default, recommended)
 *   - "revoke_session": revoke only the associated session
 *   - "ignore": log and continue (not recommended; for debugging only)
 * @todo: implement in  `RefreshTokenConfig`
 */
export type ReuseDetectionStrategy = "revoke_family" | "revoke_session" | "ignore"

export interface RefreshTokenConfig {
    /**
     * Enable refresh token issuance.
     * When false, the session lives until maxAge with no renewal path.
     * @default true
     */
    enabled?: boolean
    /**
     * Absolute lifetime of a refresh token.
     * After this the user must fully re-authenticate regardless of activity.
     * @default "7d"
     */
    maxAge?: Duration
    /**
     * Sliding window: if the token is used before this window elapses,
     * a new token is issued and the window resets.
     * Set to 0 to use absolute expiry only.
     * @default "1d"
     */
    rollingWindow?: Duration
}

export interface SessionBehaviorConfig {
    /**
     * Opaque session token / database row lifetime.
     * After this the session is expired regardless of activity.
     * @default "30d"
     */
    maxAge?: Duration
    /**
     * Sliding window: each validated request extends the session by this duration.
     * Set to 0 to use absolute expiry only (maxAge is the hard ceiling).
     * @default "1d"
     */
    rollingWindow?: Duration
    /**
     * Maximum number of concurrent active sessions per user.
     * When the limit is reached, the oldest session is automatically revoked
     * before the new one is created.
     * @default undefined (no limit)
     */
    maxSessions?: number
    /**
     * Allow one user to hold sessions linked to multiple provider accounts
     * simultaneously (e.g. GitHub + Microsoft, or two GitHub accounts).
     *
     * When false, starting a new OAuth flow for a provider that already has
     * a linked session revokes the previous session for that provider.
     * @default true
     */
    allowMultipleAccounts?: boolean
    /**
     * Revoke all active sessions when the user changes their password
     * via the credentials flow.
     *
     * The session that initiated the password change is also revoked unless
     * `keepCurrentOnRevoke` is true.
     * @default true
     */
    revokeOnPasswordChange?: boolean
    /**
     * Revoke all active sessions when the user's primary email is changed
     * and the new address has not yet been verified.
     * @default true
     */
    revokeOnEmailChange?: boolean
    /**
     * When any bulk-revocation is triggered (password change, email change,
     * admin action), preserve the session that initiated the action.
     *
     * Applies to both `revokeOnPasswordChange` and `revokeOnEmailChange`.
     * @default false
     */
    keepCurrentOnRevoke?: boolean
}

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
    refreshToken?: RefreshTokenConfig
}

/**
 * Stateful database strategy.
 * Every request validates the session against the database.
 * Enables instant revocation, multi-device management, and activity tracking.
 *
 * @example
 * {
 *   strategy: "database",
 *   adapter: PrismaAdapter(prisma),
 *   session: { maxAge: "30d", maxSessions: 5, revokeOnPasswordChange: true },
 *   refreshToken: { enabled: true, maxAge: "7d" },
 * }
 */
export type StatefulStrategyConfig = {
    strategy: "database"
    adapter: DatabaseAdapter
    session?: SessionBehaviorConfig
    refreshToken?: RefreshTokenConfig
}

/**
 * Hybrid strategy: JWT transport + database revocation authority.
 *
 * The JWT carries claims and is validated cryptographically on every request
 * (fast, no DB hit). The database session row is the revocation authority —
 * a revoked database session invalidates any JWT referencing it on next refresh.
 *
 * Rule of thumb: jwt.maxAge = how long a revoked session stays "alive" in
 * the worst case. session.maxAge = how long the user stays logged in.
 *
 * @example
 * {
 *   strategy: "hybrid",
 *   adapter: PrismaAdapter(prisma),
 *   jwt: { mode: "sealed", maxAge: "15m" },
 *   session: { maxAge: "30d", revokeOnPasswordChange: true },
 *   refreshToken: { enabled: true, maxAge: "7d" },
 * }
 */
export type HybridStrategyConfig = {
    strategy: "hybrid"
    adapter: DatabaseAdapter
    jwt?: JWTConfig
    session?: SessionBehaviorConfig
    refreshToken?: RefreshTokenConfig
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
export type SessionConfig = StatelessStrategyConfig | StatefulStrategyConfig | HybridStrategyConfig
