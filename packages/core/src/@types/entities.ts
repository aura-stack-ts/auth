import type { BuiltInOAuthProvider, LiteralUnion } from "./index.ts"

export type UserStatus = "active" | "suspended" | "pending_verification" | "deleted"

/**
 * @todo: add "passkey" and "saml" to AccountType when we implement those providers
 */
export type AccountType = "oauth" | "credentials"

export type AccountStatus = "active" | "unlinked" | "suspended"

export type SessionStatus = "active" | "expired" | "revoked"

/**
 * Tracks MFA progress within a session.
 *   - "none": MFA not required for this user or session
 *   - "pending": primary auth passed, MFA challenge not yet completed
 *   - "completed": MFA challenge passed
 *   - "skipped": trusted device, MFA step-up bypassed
 */
export type MFAState = "none" | "pending" | "completed" | "skipped"

export type MFAMethod = "totp" | "webauthn_passkey" | "webauthn_security_key" | "sms" | "email" | "recovery_code"

export type DeviceType = "desktop" | "mobile" | "tablet" | "tv" | "bot" | "unknown"

export type RevokeReason =
    | "user_logout"
    | "admin_action"
    | "password_changed"
    | "email_changed"
    | "all_sessions_revoked"
    | "mfa_disabled"
    | "account_suspended"
    | "max_sessions_exceeded"

export type MFAChallengeStatus = "pending" | "verified" | "expired" | "failed"

export interface UserEntity {
    id: string
    name: string | null
    email: string | null
    image: string | null
    emailVerifiedAt: Date | null
    status: UserStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    /**
     * Used to store the extra user attributes and extended by the `identity.schema`
     * configuration.
     */
    attributes: Record<string, unknown> | null
}

export interface AccountEntity {
    id: string
    userId: string
    provider: LiteralUnion<BuiltInOAuthProvider | "credentials">
    providerUserId: string
    type: AccountType
    status: AccountStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export interface OAuthAccountEntity {
    accountId: string
    accessToken: string
    refreshToken: string | null
    idToken: string | null
    tokenType: string | null
    scopes: string | null
    issuer: string | null
    accessTokenExpiresAt: Date | null
    refreshTokenExpiresAt: Date | null
    updatedAt: Date
}

export interface CredentialAccountEntity {
    accountId: string
    passwordHash: string
    updatedAt: Date
}

export interface SessionEntity {
    id: string
    userId: string
    deviceId: string | null
    authenticatedWith: string
    status: SessionStatus
    mfaState: MFAState
    tokenHash: string
    expiresAt: Date
    lastActivityAt: Date
    revokedAt: Date | null
    createdAt: Date
    updatedAt: Date
}

export type SessionWithUserEntity = SessionEntity & { user: UserEntity }

/**
 * Tracks physical devices across sessions.
 */
export interface DeviceEntity {
    id: string
    userId: string
    /**
     * User-assigned label for the device, e.g. "Work MacBook" or "iPhone 14 Pro".
     */
    name: string | null
    type: DeviceType
    /**
     * Platform name and version, e.g. "macOS 14.1" or "Android 14".
     */
    platform: string | null
    /**
     * Browser name and version, e.g. "Chrome 120" or "Safari 17".
     */
    browser: string | null
    /**
     * User-Agent string captured at first sign-in from this device.
     * @see https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Headers/User-Agent
     */
    userAgent: string | null
    fingerprint: string | null
    lastIp: string | null
    trusted: boolean
    firstSeenAt: Date
    lastSeenAt: Date
    deletedAt: Date | null
}

export interface MFACredentialEntity {
    id: string
    userId: string
    type: MFAMethod
    isPrimary: boolean
    verifiedAt: Date | null
    createdAt: Date
    deletedAt: Date | null
}

export interface TotpCredentialEntity {
    id: string
    credentialId: string
    secretCipher: string
    verifiedAt: Date | null
}

export interface SmsCredentialEntity {
    id: string
    credentialId: string
    phoneNumber: string
    verifiedAt: Date | null
}

export interface PushCredentialEntity {
    id: string
    credentialId: string
    platform: string
    verifiedAt: Date | null
}

export interface BackupCodeCredentialEntity {
    id: string
    credentialId: string
    codeHash: string
    createdAt: Date
    usedAt: Date | null
}

export interface MFAChallengeEntity {
    id: string
    userId: string
    sessionId: string | null
    credentialId: string
    type: MFAChallengeStatus
    attempCount: number
    expiresAt: Date
    createdAt: Date
    verifiedAt: Date | null
}

export interface VerificationTokenEntity {
    id: string
    userId: string
    tokenHash: string
    type: "email_verification" | "password_reset" | "email_change" | "mfa_recovery"
    expiresAt: Date
    revokedAt: Date | null
    createdAt: Date
}

/**
 * Stores the OAuth transaction state during an OAuth or OIDC authorization flow.
 */
export interface OAuthTransactionEntity {
    id: string
    provider: string
    state: string
    nonce: string | null
    codeVerifier: string | null
    redirectURI: string
    redirectTo: string | null
    userAgent: string | null
    fingerprint: string | null
    deviceId: string | null
    createdAt: Date
    expiresAt: Date
}
