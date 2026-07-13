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
} from "@/@types/entities.ts"

export interface UsersAdapter {
    /**
     * User management methods
     */
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

export interface AccountsAdapter {
    /**
     * Account management methods
     */
    createAccount(input: Partial<Omit<AccountEntity, "createdAt" | "updatedAt">>): Promise<AccountEntity>
    getAccountById(id: string): Promise<AccountEntity | null>
    getAccountByProvider(provider: string, providerUserId: string): Promise<AccountEntity | null>
    getAccountsByUserId(userId: string): Promise<AccountEntity[]>
    updateAccountStatus(id: string, status: AccountEntity["status"]): Promise<AccountEntity>
    unlinkAccount(id: string): Promise<void>
}

export interface OAuthAccountsAdapter {
    /**
     * OAuthAccount management methods
     */
    createOAuthAccount(input: Partial<Omit<OAuthAccountEntity, "createdAt" | "updatedAt">>): Promise<OAuthAccountEntity>
    getOAuthAccount(accountId: string): Promise<OAuthAccountEntity | null>
    updateOAuthTokens(
        accountId: string,
        input: Partial<Omit<OAuthAccountEntity, "createdAt" | "updatedAt">>
    ): Promise<OAuthAccountEntity>
}

export interface CredentialAccountsAdapter {
    /**
     * CredentialAccounts management methods.
     */
    createCredentialAccount(input: Partial<Omit<CredentialAccountEntity, "updatedAt">>): Promise<CredentialAccountEntity>
    getCredentialAccount(accountId: string): Promise<CredentialAccountEntity | null>
    updatePasswordHash(accountId: string, passwordHash: string): Promise<CredentialAccountEntity>
}

export interface SessionsAdapter {
    /**
     * Session management methods.
     */
    createSession(input: Omit<SessionEntity, "createdAt" | "updatedAt" | "lastActivityAt" | "revokedAt">): Promise<SessionEntity>
    getSessionByToken(token: string): Promise<SessionWithUserEntity | null>
    getSessionById(id: string): Promise<SessionEntity | null>
    listSessions(filter: Pick<SessionEntity, "userId" | "status" | "deviceId">): Promise<SessionEntity[]>
    updateSession(
        id: string,
        input: Omit<SessionEntity, "createdAt" | "updatedAt" | "lastActivityAt" | "revokedAt">
    ): Promise<SessionEntity>
    touchSession(id: string, lastActivityAt: Date): Promise<void>
    revokeSession(id: string, reason: RevokeReason): Promise<void>
    revokeAllSessions(userId: string, reason: RevokeReason, exceptSessionId?: string): Promise<number>
}

export interface DevicesAdapter {
    /**
     * Device management methods.
     */
    createDevice(input: Omit<DeviceEntity, "createdAt" | "updatedAt">): Promise<DeviceEntity>
    getDeviceById(id: string): Promise<DeviceEntity | null>
    getDeviceByFingerprint(userId: string, fingerprint: string): Promise<DeviceEntity | null>
    getDevicesByUserId(userId: string): Promise<DeviceEntity[]>
    updateDevice(id: string, input: Omit<DeviceEntity, "createdAt" | "updatedAt">): Promise<DeviceEntity>
    trustDevice(id: string, trusted: boolean): Promise<DeviceEntity>
    deleteDevice(id: string): Promise<void>
}

export interface MFACredentialsAdapter {
    /**
     * MFACredentials management methods.
     */
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
}

export interface OAuthTransactionsAdapter {
    /**
     * OAuthTransaction management methods.
     */
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
        OAuthTransactionsAdapter {}
