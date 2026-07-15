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

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown"

export type RevokeReason =
    | "user_logout"
    | "admin_action"
    | "password_changed"
    | "email_changed"
    | "all_sessions_revoked"
    | "mfa_disabled"
    | "account_suspended"
    | "max_sessions_exceeded"

export interface UserEntity {
    id: string
    name: string | null
    email: string | null
    image: string | null
    emailVerifiedAt: Date | null
    status: UserStatus
    mfaEnabled: boolean
    mfaPreferredMethod: MFAMethod | null
    createdAt: Date
    updatedAt: Date
    /**
     * Used to store the extra user attributes and extended by the `identity.schema`
     * configuration.
     */
    attributes: Record<string, unknown> | null
}

export interface AccountEntity {
    id: string
    userId: string
    provider: string
    providerUserId: string
    type: AccountType
    status: AccountStatus
    createdAt: Date
    updatedAt: Date
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
    metadata: Record<string, unknown> | null
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
    metadata: Record<string, unknown> | null
}

export interface MFACredentialEntity {
    id: string
    userId: string
    type: MFAMethod
    credentialData: Record<string, unknown>
    isPrimary: boolean
    verifiedAt: Date | null
    createdAt: Date
    metadata: Record<string, unknown> | null
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
    redirectUri: string
    redirectTo: string | null
    userAgent: string | null
    fingerprint: string | null
    createdAt: Date
    expiresAt: Date
    metadata: Record<string, unknown> | null
}
