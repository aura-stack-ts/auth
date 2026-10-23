import type {
    AccountEntity,
    BackupCodeCredentialEntity,
    CredentialAccountEntity,
    DeviceEntity,
    MFAChallengeEntity,
    MFACredentialEntity,
    OAuthAccountEntity,
    OAuthTransactionEntity,
    PushCredentialEntity,
    RevokeReason,
    SessionEntity,
    SessionWithUserEntity,
    SmsCredentialEntity,
    TotpCredentialEntity,
    UserEntity,
    VerificationTokenEntity,
} from "@aura-stack/auth/types"
import type {
    Account,
    BackupCode,
    CredentialAccount,
    Device,
    MfaChallenge,
    MfaCredential,
    OAuthAccount,
    OAuthTransaction,
    PushCredential,
    Session,
    SmsCredential,
    TotpCredential,
    User,
    VerificationToken,
} from "@/generated/prisma/client.js"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

export const toJson = (value: Record<string, unknown> | null | undefined) => (value ?? undefined) as never

export const fromJson = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null)

export const toUser = (user: User): UserEntity => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    emailVerifiedAt: user.emailVerifiedAt,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    attributes: fromJson(user.attributes),
    deletedAt: user.deletedAt,
})

export const toAccount = (account: Account): AccountEntity => ({
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    providerUserId: account.providerUserId,
    type: account.type,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    deletedAt: account.deletedAt,
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
    status: session.status,
    mfaState: session.mfaState,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt,
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
    type: device.type,
    platform: device.platform,
    browser: device.browser,
    userAgent: device.userAgent,
    fingerprint: device.fingerprint,
    lastIp: device.lastIp,
    trusted: device.trusted,
    firstSeenAt: device.firstSeenAt,
    lastSeenAt: device.lastSeenAt,
    deletedAt: device.deletedAt,
})

export const toMFACredential = (credential: MfaCredential): MFACredentialEntity => ({
    id: credential.id,
    userId: credential.userId,
    type: credential.type,
    status: credential.status,
    isPrimary: credential.isPrimary,
    verifiedAt: credential.verifiedAt,
    createdAt: credential.createdAt,
    deletedAt: credential.deletedAt,
    enrolledAt: credential.enrolledAt,
})

export const toOAuthTransaction = (transaction: OAuthTransaction): OAuthTransactionEntity => ({
    id: transaction.id,
    provider: transaction.provider,
    state: transaction.state,
    nonce: transaction.nonce,
    codeVerifier: transaction.codeVerifier,
    redirectURI: transaction.redirectURI,
    redirectTo: transaction.redirectTo,
    userAgent: transaction.userAgent,
    fingerprint: transaction.fingerprint,
    createdAt: transaction.createdAt,
    expiresAt: transaction.expiresAt,
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

export const toTotpCredential = (credential: TotpCredential): TotpCredentialEntity => ({
    id: credential.id,
    credentialId: credential.credentialId,
    secretCipher: credential.secretCipher,
    verifiedAt: credential.verifiedAt,
})

export const toSmsCredential = (credential: SmsCredential): SmsCredentialEntity => ({
    id: credential.id,
    credentialId: credential.credentialId,
    phoneNumber: credential.phoneNumber,
    verifiedAt: credential.verifiedAt,
})

export const toPushCredential = (credential: PushCredential): PushCredentialEntity => ({
    id: credential.id,
    credentialId: credential.credentialId,
    deviceToken: credential.deviceToken,
    platform: credential.platform,
    verifiedAt: credential.verifiedAt,
})

export const toBackupCode = (code: BackupCode): BackupCodeCredentialEntity => ({
    id: code.id,
    credentialId: code.credentialId,
    codeHash: code.codeHash,
    createdAt: code.createdAt,
    used: code.used,
    usedAt: code.usedAt,
})

export const toMFAChallenge = (challenge: MfaChallenge): MFAChallengeEntity => ({
    id: challenge.id,
    userId: challenge.userId,
    sessionId: challenge.sessionId ?? "",
    credentialId: challenge.credentialId,
    type: challenge.type,
    status: challenge.status,
    attemptCount: challenge.attemptCount,
    expiresAt: challenge.expiresAt,
    createdAt: challenge.createdAt,
    verifiedAt: challenge.verifiedAt,
})

export const toVerificationToken = (token: VerificationToken): VerificationTokenEntity => ({
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    type: token.type,
    identifier: token.identifier ?? "",
    newIdentifier: token.newIdentifier,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    createdAt: token.createdAt,
})
