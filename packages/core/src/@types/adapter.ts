import type {
    UserEntity,
    AccountEntity,
    OAuthAccountEntity,
    CredentialAccountEntity,
    SessionEntity,
    SessionWithUserEntity,
    DeviceEntity,
    MFACredentialEntity,
    MFAMethod,
    OAuthTransactionEntity,
    RevokeReason,
    TotpCredentialEntity,
    SmsCredentialEntity,
    PushCredentialEntity,
    BackupCodeCredentialEntity,
    MFAChallengeEntity,
    VerificationTokenEntity,
} from "@/@types/entities.ts"

/**
 * User management methods
 */
export interface UsersAdapter {
    createUser(input: Partial<Omit<UserEntity, "createdAt" | "updatedAt">>): Promise<UserEntity>
    getUserById(id: string): Promise<UserEntity | null>
    getUserByEmail(email: string): Promise<UserEntity | null>
    updateUser(id: string, input: Partial<Omit<UserEntity, "createdAt" | "updatedAt">>): Promise<UserEntity>
    /**
     * Soft delete: sets status = "deleted", row is preserved.
     * Hard delete: removes the row and all owned rows (Accounts, Sessions,
     * Devices, MfaCredentials). Strategy is set in AdapterConfig, not here.
     *
     * Delete an user based on the selected strategy.
     *   - `"soft"`: The user is marked as deleted, but the row is preserved in the database.
     *   - `"hard"`: The user and all associated data (Accounts, Sessions, Devices, MfaCredentials) are permanently removed from the database.
     */
    deleteUser(id: string): Promise<void>
}

/**
 * Account management methods
 */
export interface AccountsAdapter {
    createAccount(input: Partial<Omit<AccountEntity, "createdAt" | "updatedAt">>): Promise<AccountEntity>
    getAccountById(id: string): Promise<AccountEntity | null>
    getAccountByProvider(provider: string, providerUserId: string): Promise<AccountEntity | null>
    getAccountsByUserId(userId: string): Promise<AccountEntity[]>
    updateAccountStatus(id: string, status: AccountEntity["status"]): Promise<AccountEntity>
    unlinkAccount(id: string): Promise<void>
}

/**
 * OAuthAccount management methods
 */
export interface OAuthAccountsAdapter {
    createOAuthAccount(input: Partial<Omit<OAuthAccountEntity, "createdAt" | "updatedAt">>): Promise<OAuthAccountEntity>
    getOAuthAccount(accountId: string): Promise<OAuthAccountEntity | null>
    updateOAuthTokens(
        accountId: string,
        input: Partial<Omit<OAuthAccountEntity, "createdAt" | "updatedAt">>
    ): Promise<OAuthAccountEntity>
}

/**
 * CredentialAccounts management methods.
 */
export interface CredentialAccountsAdapter {
    createCredentialAccount(input: Partial<Omit<CredentialAccountEntity, "updatedAt">>): Promise<CredentialAccountEntity>
    getCredentialAccount(accountId: string): Promise<CredentialAccountEntity | null>
    updatePasswordHash(accountId: string, passwordHash: string): Promise<CredentialAccountEntity>
}

/**
 * Session management methods.
 */
export interface SessionsAdapter {
    createSession(input: Omit<SessionEntity, "createdAt" | "updatedAt" | "lastActivityAt" | "revokedAt">): Promise<SessionEntity>
    getSessionByToken(token: string): Promise<SessionWithUserEntity | null>
    getSessionById(id: string): Promise<SessionEntity | null>
    listSessions(filter: Pick<SessionEntity, "userId" | "status" | "deviceId">): Promise<SessionEntity[]>
    updateSession(
        id: string,
        input: Partial<Omit<SessionEntity, "createdAt" | "updatedAt" | "revokedAt">>
    ): Promise<SessionEntity>
    touchSession(id: string, lastActivityAt: Date): Promise<void>
    revokeSession(id: string, reason: RevokeReason): Promise<void>
    revokeAllSessions(userId: string, reason: RevokeReason, exceptSessionId?: string): Promise<number>
}

/**
 * Device management methods.
 */
export interface DevicesAdapter {
    createDevice(input: Omit<DeviceEntity, "id" | "createdAt" | "updatedAt">): Promise<DeviceEntity>
    getDeviceById(id: string): Promise<DeviceEntity | null>
    getDeviceByFingerprint(userId: string, fingerprint: string): Promise<DeviceEntity | null>
    getDevicesByUserId(userId: string): Promise<DeviceEntity[]>
    updateDevice(id: string, input: Partial<Omit<DeviceEntity, "createdAt" | "updatedAt">>): Promise<DeviceEntity>
    trustDevice(id: string, trusted: boolean): Promise<DeviceEntity>
    deleteDevice(id: string): Promise<void>
}

/**
 * MFACredentials management methods.
 */
export interface MFACredentialsAdapter {
    createMfaCredential(input: Omit<MFACredentialEntity, "id" | "verifiedAt" | "updatedAt">): Promise<MFACredentialEntity>
    getMfaCredentialById(id: string): Promise<MFACredentialEntity | null>
    getMfaCredentialsByUserId(userId: string): Promise<MFACredentialEntity[]>
    getMfaCredentialsByType(userId: string, type: MFAMethod): Promise<MFACredentialEntity[]>
    verifyMfaCredential(id: string): Promise<MFACredentialEntity>
    updateMfaCredential(
        id: string,
        input: Omit<MFACredentialEntity, "id" | "verifiedAt" | "updatedAt">
    ): Promise<MFACredentialEntity>
    deleteMfaCredential(id: string): Promise<void>

    createTotpCredential(input: Omit<TotpCredentialEntity, "id">): Promise<TotpCredentialEntity>
    getTotpCredentialByCredentialId(credentialId: string): Promise<TotpCredentialEntity | null>

    createSmsCredential(input: Omit<SmsCredentialEntity, "id">): Promise<SmsCredentialEntity>
    getSmsCredentialByCredentialId(credentialId: string): Promise<SmsCredentialEntity | null>

    createPushCredential(input: Omit<PushCredentialEntity, "id">): Promise<PushCredentialEntity>
    getPushCredentialByCredentialId(credentialId: string): Promise<PushCredentialEntity | null>

    createBackupCodes(
        credentialId: string,
        codes: Array<Omit<BackupCodeCredentialEntity, "id" | "credentialId" | "createdAt" | "used" | "usedAt">>
    ): Promise<BackupCodeCredentialEntity[]>
    verifyBackupCode(credentialId: string, codeHash: string): Promise<boolean>
}

/**
 * MFAChallenges management methods.
 */
export interface MFAChallengesAdapter {
    createChallenge(input: Omit<MFAChallengeEntity, "id" | "createdAt" | "verifiedAt">): Promise<MFAChallengeEntity>
    getChallengeById(id: string): Promise<MFAChallengeEntity | null>
    incrementAttemptCount(id: string): Promise<MFAChallengeEntity>
    verifyChallenge(id: string): Promise<MFAChallengeEntity>
    expireChallenges(sessionId: string): Promise<void>
}

/**
 * VerificationTokens management methods.
 */
export interface VerificationTokensAdapter {
    createToken(input: Omit<VerificationTokenEntity, "id" | "createdAt" | "revokedAt">): Promise<VerificationTokenEntity>
    getTokenByHash(tokenHash: string): Promise<VerificationTokenEntity | null>
    revokeToken(id: string): Promise<void>
}

/**
 * OAuthTransaction management methods.
 */
export interface OAuthTransactionsAdapter {
    createOAuthTransaction(input: OAuthTransactionEntity): Promise<OAuthTransactionEntity>
    getOAuthTransactionByState(state: string): Promise<OAuthTransactionEntity | null>
    consumeOAuthTransaction(state: string): Promise<OAuthTransactionEntity | null>
    deleteExpiredOAuthTransactions(): Promise<number>
}

/**
 * The database adapter interface. Each provider package must implement this.
 */
export interface DatabaseAdapter
    extends
        UsersAdapter,
        AccountsAdapter,
        OAuthAccountsAdapter,
        CredentialAccountsAdapter,
        SessionsAdapter,
        DevicesAdapter,
        MFACredentialsAdapter,
        MFAChallengesAdapter,
        VerificationTokensAdapter,
        OAuthTransactionsAdapter {}
