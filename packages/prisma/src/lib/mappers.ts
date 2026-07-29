import type {
    AccountEntity,
    AccountStatus,
    AccountType,
    CredentialAccountEntity,
    DeviceEntity,
    DeviceType,
    MFACredentialEntity,
    MFAMethod,
    MFAState,
    OAuthAccountEntity,
    OAuthTransactionEntity,
    RevokeReason,
    SessionEntity,
    SessionStatus,
    SessionWithUserEntity,
    UserEntity,
    UserStatus,
} from "@aura-stack/auth/types"
import type {
    Account,
    AccountStatus as PrismaAccountStatus,
    AccountType as PrismaAccountType,
    CredentialAccount,
    Device,
    DeviceType as PrismaDeviceType,
    MfaCredential,
    MfaState as PrismaMfaState,
    MfaType,
    OAuthAccount,
    OAuthTransaction,
    Session,
    SessionStatus as PrismaSessionStatus,
    User,
    UserStatus as PrismaUserStatus,
} from "@/generated/prisma/client.js"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

export const toJson = (value: Record<string, unknown> | null | undefined) => (value ?? undefined) as never

export const fromJson = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null)

export const toUserStatus = (status: UserStatus): PrismaUserStatus => {
    switch (status) {
        case "active":
            return "ACTIVE"
        case "pending_verification":
            return "PENDING"
        case "suspended":
            return "SUSPENDED"
        case "deleted":
            return "DELETED"
    }
}

export const fromUserStatus = (status: PrismaUserStatus): UserStatus => {
    switch (status) {
        case "ACTIVE":
            return "active"
        case "PENDING":
            return "pending_verification"
        case "SUSPENDED":
            return "suspended"
        case "DELETED":
            return "deleted"
    }
}

export const fromAccountType = (type: PrismaAccountType): AccountType => {
    switch (type) {
        case "OAUTH":
            return "oauth"
        case "CREDENTIALS":
            return "credentials"
    }
}

export const toAccountType = (type: AccountType): PrismaAccountType => {
    switch (type) {
        case "oauth":
            return "OAUTH"
        case "credentials":
            return "CREDENTIALS"
    }
}

export const fromAccountStatus = (status: PrismaAccountStatus): AccountStatus => {
    switch (status) {
        case "ACTIVE":
            return "active"
        case "UNLINKED":
            return "unlinked"
        case "SUSPENDED":
            return "suspended"
    }
}

export const toAccountStatus = (status: AccountStatus): PrismaAccountStatus => {
    switch (status) {
        case "active":
            return "ACTIVE"
        case "unlinked":
            return "UNLINKED"
        case "suspended":
            return "SUSPENDED"
    }
}

export const fromSessionStatus = (status: PrismaSessionStatus): SessionStatus => {
    switch (status) {
        case "ACTIVE":
            return "active"
        case "EXPIRED":
            return "expired"
        case "REVOKED":
            return "revoked"
    }
}

export const toSessionStatus = (status: SessionStatus): PrismaSessionStatus => {
    switch (status) {
        case "active":
            return "ACTIVE"
        case "expired":
            return "EXPIRED"
        case "revoked":
            return "REVOKED"
    }
}

export const fromMFAStatus = (state: PrismaMfaState): MFAState => {
    switch (state) {
        case "NONE":
            return "none"
        case "PENDING":
            return "pending"
        case "COMPLETED":
            return "completed"
        case "SKIPPED":
            return "skipped"
    }
}

export const toMFAStatus = (state: MFAState): PrismaMfaState => {
    switch (state) {
        case "none":
            return "NONE"
        case "pending":
            return "PENDING"
        case "completed":
            return "COMPLETED"
        case "skipped":
            return "SKIPPED"
    }
}

export const fromMFAMethod = (type: MfaType): MFAMethod => {
    switch (type) {
        case "TOTP":
            return "totp"
        case "EMAIL":
            return "email"
        case "SMS":
            return "sms"
        case "WEBAUTHN_PASSKEY":
            return "webauthn_passkey"
        case "WEBAUTHN_SECURITY_KEY":
            return "webauthn_security_key"
        case "RECOVERY_CODE":
            return "recovery_code"
    }
}

export const toMFAMethod = (type: MFAMethod): MfaType => {
    switch (type) {
        case "totp":
            return "TOTP"
        case "email":
            return "EMAIL"
        case "sms":
            return "SMS"
        case "webauthn_passkey":
            return "WEBAUTHN_PASSKEY"
        case "webauthn_security_key":
            return "WEBAUTHN_SECURITY_KEY"
        case "recovery_code":
            return "RECOVERY_CODE"
    }
}

export const fromDeviceType = (type: PrismaDeviceType): DeviceType => {
    switch (type) {
        case "DESKTOP":
            return "desktop"
        case "MOBILE":
            return "mobile"
        case "TABLET":
            return "tablet"
        case "TV":
            return "tv"
        case "BOT":
            return "bot"
        case "UNKNOWN":
            return "unknown"
    }
}

export const toDeviceType = (type: DeviceType): PrismaDeviceType => {
    switch (type) {
        case "desktop":
            return "DESKTOP"
        case "mobile":
            return "MOBILE"
        case "tablet":
            return "TABLET"
        case "tv":
            return "TV"
        case "bot":
            return "BOT"
        case "unknown":
            return "UNKNOWN"
    }
}

export const toUser = (user: User): UserEntity => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    emailVerifiedAt: user.emailVerifiedAt,
    status: fromUserStatus(user.status),
    mfaEnabled: user.mfaEnabled,
    mfaPreferredMethod: user.mfaPreferredMethod ? fromMFAMethod(user.mfaPreferredMethod) : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    attributes: fromJson(user.attributes),
})

export const toAccount = (account: Account): AccountEntity => ({
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    providerUserId: account.providerUserId,
    type: fromAccountType(account.type),
    status: fromAccountStatus(account.status),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
})

export const toOAuthAccount = (account: OAuthAccount): OAuthAccountEntity => ({
    accountId: account.accountId,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    idToken: account.idToken,
    tokenType: account.tokenType,
    scopes: account.scopes,
    issuer: account.issuer,
    accessTokenExpiresAt: account.accessTokenExpiresAt,
    refreshTokenExpiresAt: account.refreshTokenExpiresAt,
    updatedAt: account.updatedAt,
})

export const toCredentialAccount = (account: CredentialAccount): CredentialAccountEntity => ({
    accountId: account.accountId,
    passwordHash: account.passwordHash,
    updatedAt: account.updatedAt,
})

export const toSession = (session: Session): SessionEntity => ({
    id: session.id,
    userId: session.userId,
    deviceId: session.deviceId,
    authenticatedWith: session.authenticatedWith,
    status: fromSessionStatus(session.status),
    mfaState: fromMFAStatus(session.mfaState),
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt,
    metadata: fromJson(session.metadata),
    lastActivityAt: session.lastActivityAt,
    revokedAt: session.revokedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
})

export const toSessionWithUser = (session: Session & { user: User }): SessionWithUserEntity => ({
    ...toSession(session),
    user: toUser(session.user),
})

export const toDevice = (device: Device): DeviceEntity => ({
    id: device.id,
    userId: device.userId,
    name: device.name,
    type: fromDeviceType(device.type),
    platform: device.platform,
    browser: device.browser,
    userAgent: device.userAgent,
    fingerprint: device.fingerprint,
    lastIp: device.lastIp,
    trusted: device.trusted,
    firstSeenAt: device.firstSeenAt,
    lastSeenAt: device.lastSeenAt,
    metadata: fromJson(device.metadata),
})

export const toMFACredential = (credential: MfaCredential): MFACredentialEntity => ({
    id: credential.id,
    userId: credential.userId,
    type: fromMFAMethod(credential.type),
    credentialData: fromJson(credential.credentialData) ?? {},
    isPrimary: credential.isPrimary,
    verifiedAt: credential.verifiedAt,
    createdAt: credential.createdAt,
    metadata: fromJson(credential.metadata),
})

export const toOAuthTransaction = (transaction: OAuthTransaction): OAuthTransactionEntity => ({
    id: transaction.id,
    provider: transaction.provider,
    state: transaction.state,
    nonce: transaction.nonce,
    codeVerifier: transaction.codeVerifier,
    redirectUri: transaction.redirectUri,
    redirectTo: transaction.redirectTo,
    userAgent: transaction.userAgent,
    fingerprint: transaction.fingerprint,
    createdAt: transaction.createdAt,
    expiresAt: transaction.expiresAt,
    metadata: fromJson(transaction.metadata),
    deviceId: transaction.deviceId,
})

export const appendRevokeReason = (
    metadata: Record<string, unknown> | null,
    reason: RevokeReason,
    revokedAt: Date
): Record<string, unknown> => ({
    ...(metadata ?? {}),
    revokeReason: reason,
    revokedAt: revokedAt.toISOString(),
})
