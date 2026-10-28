import type { DatabaseAdapter } from "@aura-stack/auth/types"
import { type PrismaClient, UserStatus } from "@/generated/prisma/client.ts"
import {
    toAccount,
    toBackupCode,
    toCredentialAccount,
    toDevice,
    toMFAChallenge,
    toMFACredential,
    toOAuthAccount,
    toOAuthTransaction,
    toPushCredential,
    toSession,
    toSessionWithUser,
    toSmsCredential,
    toTotpCredential,
    toUser,
    toVerificationToken,
    toJson,
} from "@/lib/mappers.ts"
import { setUndefinedToNull, stripNullishValues } from "@/lib/utils.ts"

export interface PrismaAdapterOptions {
    /**
     * A Prisma Client instance configured for your database.
     * Reuse a single instance per application process.
     */
    client: PrismaClient
    /**
     * Strategy used by `deleteUser`. Defaults to `"soft"`.
     */
    deleteStrategy?: "soft" | "hard"
}

export const prismaAdapter = ({ client, deleteStrategy = "soft" }: PrismaAdapterOptions): DatabaseAdapter => {
    return {
        /**
         * Users
         */
        createUser: async (input) => {
            const user = await client.user.create({
                data: {
                    ...input,
                    emailVerifiedAt: input.emailVerifiedAt ?? null,
                    status: input.status,
                    attributes: toJson(input.attributes),
                },
            })
            return toUser(user)
        },
        getUserById: async (id) => {
            const user = await client.user.findUnique({ where: { id } })
            return user ? toUser(user) : null
        },
        getUserByEmail: async (email) => {
            const user = await client.user.findUnique({ where: { email } })
            return user ? toUser(user) : null
        },
        updateUser: async (id, input) => {
            const stripped = stripNullishValues(input)
            const user = await client.user.update({
                where: { id },
                data: {
                    ...stripped,
                    status: input.status,
                    attributes: input.attributes === undefined ? undefined : toJson(input.attributes),
                },
            })
            return toUser(user)
        },
        deleteUser: async (id) => {
            if (deleteStrategy === "hard") {
                await client.user.delete({ where: { id } })
            } else {
                const now = new Date()
                await client.$transaction([
                    client.user.update({
                        where: { id },
                        data: { status: UserStatus.deleted, updatedAt: now },
                    }),
                    client.session.updateMany({
                        where: { userId: id, status: "active" },
                        data: { status: "revoked", revokedAt: now },
                    }),
                ])
            }
        },
        /**
         * Accounts
         */
        createAccount: async (input) => {
            const account = await client.account.create({
                data: {
                    id: input.id,
                    userId: input.userId!,
                    provider: input.provider!,
                    providerUserId: input.providerUserId!,
                    type: input.type!,
                    status: input.status,
                },
            })
            return toAccount(account)
        },
        getAccountById: async (id) => {
            const account = await client.account.findUnique({ where: { id } })
            return account ? toAccount(account) : null
        },
        getAccountByProvider: async (provider, providerUserId) => {
            const account = await client.account.findUnique({
                where: {
                    provider_providerUserId: {
                        provider,
                        providerUserId,
                    },
                },
            })
            return account ? toAccount(account) : null
        },
        getAccountsByUserId: async (userId) => {
            const accounts = await client.account.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            })
            return accounts.map(toAccount)
        },
        updateAccountStatus: async (id, status) => {
            const account = await client.account.update({
                where: { id },
                data: { status: status },
            })
            return toAccount(account)
        },
        unlinkAccount: async (id) => {
            await client.$transaction([
                client.oAuthAccount.deleteMany({ where: { accountId: id } }),
                client.account.update({
                    where: { id },
                    data: { status: "unlinked" },
                }),
            ])
        },
        /**
         * OAuth Accounts
         */
        createOAuthAccount: async (input) => {
            if (!input.accountId || !input.accessToken) {
                throw new Error("accountId and accessToken are required for creating an OAuth account.")
            }

            const data = setUndefinedToNull(input)
            const account = await client.oAuthAccount.create({
                data: {
                    ...data,
                    accountId: input.accountId,
                    accessToken: input.accessToken,
                },
            })
            return toOAuthAccount(account)
        },
        getOAuthAccount: async (accountId) => {
            const account = await client.oAuthAccount.findUnique({
                where: { accountId },
            })
            return account ? toOAuthAccount(account) : null
        },
        updateOAuthTokens: async (accountId, input) => {
            const stripped = stripNullishValues(input)
            const account = await client.oAuthAccount.update({
                where: { accountId },
                data: stripped,
            })
            return toOAuthAccount(account)
        },
        /**
         * Credential Accounts
         */
        createCredentialAccount: async (input) => {
            const account = await client.credentialAccount.create({
                data: {
                    accountId: input.accountId!,
                    passwordHash: input.passwordHash!,
                },
            })
            return toCredentialAccount(account)
        },
        getCredentialAccount: async (accountId) => {
            const account = await client.credentialAccount.findUnique({ where: { accountId } })
            return account ? toCredentialAccount(account) : null
        },
        updatePasswordHash: async (accountId, passwordHash) => {
            const account = await client.credentialAccount.update({
                where: { accountId },
                data: { passwordHash },
            })
            return toCredentialAccount(account)
        },
        /**
         * Sessions
         */
        createSession: async (input) => {
            const session = await client.session.create({
                data: {
                    ...input,
                    status: input.status,
                    mfaState: input.mfaState,
                    lastActivityAt: new Date(),
                },
            })
            return toSession(session)
        },
        getSessionByToken: async (token) => {
            const session = await client.session.findUnique({
                where: {
                    tokenHash: token,
                    status: "active",
                    expiresAt: { gt: new Date() },
                },
                include: { user: true },
            })
            return session ? toSessionWithUser(session) : null
        },
        getSessionById: async (id) => {
            const session = await client.session.findUnique({ where: { id, status: "active" } })
            return session ? toSession(session) : null
        },
        listSessions: async (filter) => {
            const sessions = await client.session.findMany({
                where: {
                    userId: filter.userId,
                    ...(filter.status !== undefined && { status: filter.status }),
                    ...(filter.deviceId !== undefined && { deviceId: filter.deviceId }),
                },
                orderBy: { createdAt: "desc" },
            })
            return sessions.map(toSession)
        },
        updateSession: async (id, input) => {
            const stripped = stripNullishValues(input)
            const session = await client.session.update({
                where: { id },
                data: {
                    ...stripped,
                    status: input?.status ?? "active",
                    mfaState: input?.mfaState,
                },
            })
            return toSession(session)
        },
        touchSession: async (id, lastActivityAt) => {
            await client.session.update({
                where: { id, status: "active" },
                data: { lastActivityAt },
            })
        },
        revokeSession: async (id, _reason) => {
            const existing = await client.session.findUnique({ where: { id } })
            if (!existing) {
                return
            }

            const revokedAt = new Date()
            await client.session.update({
                where: { id },
                data: {
                    status: "revoked",
                    revokedAt,
                },
            })
        },
        revokeAllSessions: async (userId, _reason, exceptSessionId) => {
            const sessions = await client.session.findMany({
                where: {
                    userId,
                    status: "active",
                    ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
                },
            })
            if (sessions.length === 0) {
                return 0
            }
            const revokedAt = new Date()
            await client.$transaction(
                sessions.map((session) =>
                    client.session.update({
                        where: { id: session.id },
                        data: {
                            status: "revoked",
                            revokedAt,
                        },
                    })
                )
            )
            return sessions.length
        },
        /**
         * Devices
         */
        createDevice: async (input) => {
            const device = await client.device.create({
                data: {
                    ...input,
                    type: input.type,
                },
            })
            return toDevice(device)
        },
        getDeviceById: async (id) => {
            const device = await client.device.findUnique({ where: { id } })
            return device ? toDevice(device) : null
        },
        getDeviceByFingerprint: async (userId, fingerprint) => {
            const device = await client.device.findFirst({
                where: { userId, fingerprint },
            })
            return device ? toDevice(device) : null
        },
        getDevicesByUserId: async (userId) => {
            const devices = await client.device.findMany({
                where: { userId },
                orderBy: { lastSeenAt: "desc" },
            })
            return devices.map(toDevice)
        },
        updateDevice: async (id, input) => {
            const stripped = stripNullishValues(input)
            const device = await client.device.update({
                where: { id },
                data: {
                    ...stripped,
                    type: input.type ?? "unknown",
                },
            })
            return toDevice(device)
        },
        trustDevice: async (id, trusted) => {
            const device = await client.device.update({
                where: { id },
                data: { trusted },
            })
            return toDevice(device)
        },
        deleteDevice: async (id) => {
            await client.device.delete({ where: { id } })
        },
        createMfaCredential: async (input) => {
            const credential = await client.mfaCredential.create({
                data: {
                    userId: input.userId,
                    type: input.type,
                    isPrimary: input.isPrimary ?? false,
                    status: input.status ?? "active",
                },
            })
            return toMFACredential(credential)
        },
        getMfaCredentialById: async (id) => {
            const credential = await client.mfaCredential.findUnique({ where: { id } })
            return credential ? toMFACredential(credential) : null
        },
        getMfaCredentialsByUserId: async (userId) => {
            const credentials = await client.mfaCredential.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            })
            return credentials.map(toMFACredential)
        },
        getMfaCredentialsByType: async (userId, type) => {
            const credentials = await client.mfaCredential.findMany({
                where: {
                    userId,
                    type,
                },
                orderBy: { createdAt: "desc" },
            })
            return credentials.map(toMFACredential)
        },
        verifyMfaCredential: async (id) => {
            const credential = await client.mfaCredential.update({
                where: { id },
                data: { verifiedAt: new Date() },
            })
            return toMFACredential(credential)
        },
        updateMfaCredential: async (id, input) => {
            const stripped = stripNullishValues(input)
            const credential = await client.mfaCredential.update({
                where: { id },
                data: {
                    ...stripped,
                    type: input.type,
                },
            })
            return toMFACredential(credential)
        },
        deleteMfaCredential: async (id) => {
            await client.mfaCredential.delete({ where: { id } })
        },
        createTotpCredential: async (input) => {
            const credential = await client.totpCredential.create({
                data: {
                    credentialId: input.credentialId,
                    secretCipher: input.secretCipher,
                    verifiedAt: input.verifiedAt,
                },
            })
            return toTotpCredential(credential)
        },
        getTotpCredentialByCredentialId: async (credentialId) => {
            const credential = await client.totpCredential.findUnique({
                where: { credentialId },
            })
            return credential ? toTotpCredential(credential) : null
        },
        createSmsCredential: async (input) => {
            const credential = await client.smsCredential.create({
                data: {
                    credentialId: input.credentialId,
                    phoneNumber: input.phoneNumber,
                    verifiedAt: input.verifiedAt,
                },
            })
            return toSmsCredential(credential)
        },
        getSmsCredentialByCredentialId: async (credentialId) => {
            const credential = await client.smsCredential.findUnique({
                where: { credentialId },
            })
            return credential ? toSmsCredential(credential) : null
        },
        createPushCredential: async (input) => {
            const credential = await client.pushCredential.create({
                data: {
                    credentialId: input.credentialId,
                    deviceToken: input.deviceToken,
                    platform: input.platform,
                    verifiedAt: input.verifiedAt,
                },
            })
            return toPushCredential(credential)
        },
        getPushCredentialByCredentialId: async (credentialId) => {
            const credential = await client.pushCredential.findUnique({
                where: { credentialId },
            })
            return credential ? toPushCredential(credential) : null
        },
        createBackupCodes: async (credentialId, codes) => {
            const result = await client.$transaction(
                codes.map((code) =>
                    client.backupCode.create({
                        data: {
                            credentialId,
                            codeHash: code.codeHash,
                        },
                    })
                )
            )
            return result.map(toBackupCode)
        },
        verifyBackupCode: async (credentialId, codeHash) => {
            const result = await client.backupCode.updateMany({
                where: { credentialId, codeHash, used: false },
                data: { used: true, usedAt: new Date() },
            })
            return result.count > 0
        },
        /**
         * MFA Challenges
         */
        createChallenge: async (input) => {
            const challenge = await client.mfaChallenge.create({
                data: {
                    userId: input.userId,
                    sessionId: input.sessionId,
                    credentialId: input.credentialId,
                    type: input.type,
                    status: input.status,
                    attemptCount: input.attemptCount,
                    expiresAt: input.expiresAt,
                },
            })
            return toMFAChallenge(challenge)
        },
        getChallengeById: async (id) => {
            const challenge = await client.mfaChallenge.findUnique({ where: { id } })
            return challenge ? toMFAChallenge(challenge) : null
        },
        incrementAttemptCount: async (id) => {
            const challenge = await client.mfaChallenge.update({
                where: { id },
                data: { attemptCount: { increment: 1 } },
            })
            return toMFAChallenge(challenge)
        },
        verifyChallenge: async (id) => {
            const challenge = await client.mfaChallenge.update({
                where: { id },
                data: { status: "verified", verifiedAt: new Date() },
            })
            return toMFAChallenge(challenge)
        },
        expireChallenges: async (sessionId) => {
            await client.mfaChallenge.updateMany({
                where: {
                    sessionId,
                    status: "pending",
                },
                data: { status: "expired" },
            })
        },
        /**
         * Verification Tokens
         */
        createToken: async (input) => {
            const token = await client.verificationToken.create({
                data: {
                    userId: input.userId,
                    tokenHash: input.tokenHash,
                    type: input.type,
                    identifier: input.identifier ?? null,
                    newIdentifier: input.newIdentifier,
                    expiresAt: input.expiresAt,
                },
            })
            return toVerificationToken(token)
        },
        getTokenByHash: async (tokenHash) => {
            const token = await client.verificationToken.findUnique({
                where: { tokenHash },
            })
            return token ? toVerificationToken(token) : null
        },
        revokeToken: async (id) => {
            await client.verificationToken.update({
                where: { id },
                data: { revokedAt: new Date() },
            })
        },
        getTokensByUserId: async (userId) => {
            const tokens = await client.verificationToken.findMany({
                where: { userId },
            })
            return tokens.map(toVerificationToken)
        },
        /**
         * OAuth Transactions
         */
        createOAuthTransaction: async (input) => {
            const transaction = await client.oAuthTransaction.create({
                data: {
                    ...input,
                },
            })
            return toOAuthTransaction(transaction)
        },
        getOAuthTransactionByState: async (state) => {
            const transaction = await client.oAuthTransaction.findUnique({ where: { state } })
            if (!transaction || transaction.expiresAt < new Date()) {
                return null
            }
            return toOAuthTransaction(transaction)
        },
        consumeOAuthTransaction: async (state) => {
            return client.$transaction(async (tx) => {
                const transaction = await tx.oAuthTransaction.findUnique({ where: { state } })
                if (!transaction) {
                    return null
                }
                await tx.oAuthTransaction.delete({ where: { state } })
                return toOAuthTransaction(transaction)
            })
        },
        deleteExpiredOAuthTransactions: async () => {
            const result = await client.oAuthTransaction.deleteMany({
                where: {
                    expiresAt: { lt: new Date() },
                },
            })
            return result.count
        },
    }
}
