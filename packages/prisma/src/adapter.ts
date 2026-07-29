import type { DatabaseAdapter } from "@aura-stack/auth/types"
import { type PrismaClient, UserStatus } from "@/generated/prisma/client.ts"
import {
    appendRevokeReason,
    toAccount,
    toAccountStatus,
    toAccountType,
    toCredentialAccount,
    toDevice,
    toDeviceType,
    toMFACredential,
    toMFAMethod,
    toMFAStatus,
    toOAuthAccount,
    toOAuthTransaction,
    toSession,
    toSessionStatus,
    toSessionWithUser,
    toUser,
    toUserStatus,
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
                    status: input.status ? toUserStatus(input.status) : undefined,
                    mfaPreferredMethod: input.mfaPreferredMethod ? toMFAMethod(input.mfaPreferredMethod) : undefined,
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
                    status: input.status ? toUserStatus(input.status) : undefined,
                    mfaPreferredMethod:
                        input.mfaPreferredMethod === undefined
                            ? undefined
                            : input.mfaPreferredMethod
                              ? toMFAMethod(input.mfaPreferredMethod)
                              : null,
                    attributes: input.attributes === undefined ? undefined : toJson(input.attributes),
                },
            })
            return toUser(user)
        },
        deleteUser: async (id) => {
            if (deleteStrategy === "hard") {
                await client.user.delete({ where: { id } })
            } else {
                await client.user.update({
                    where: { id },
                    data: { status: UserStatus.DELETED, updatedAt: new Date() },
                })
                await client.session.updateManyAndReturn({
                    where: { userId: id, status: "ACTIVE" },
                    data: { status: "REVOKED", revokedAt: new Date() },
                })
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
                    type: toAccountType(input.type!),
                    status: input.status ? toAccountStatus(input.status) : undefined,
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
                data: { status: toAccountStatus(status) },
            })
            return toAccount(account)
        },
        unlinkAccount: async (id) => {
            await client.$transaction([
                client.oAuthAccount.deleteMany({ where: { accountId: id } }),
                client.account.update({
                    where: { id },
                    data: { status: "UNLINKED" },
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
                    status: toSessionStatus(input.status),
                    mfaState: toMFAStatus(input.mfaState),
                    metadata: toJson(input.metadata),
                    lastActivityAt: new Date(),
                },
            })
            return toSession(session)
        },
        getSessionByToken: async (token) => {
            const session = await client.session.findUnique({
                where: {
                    tokenHash: token,
                    status: "ACTIVE",
                    expiresAt: { gt: new Date() },
                },
                include: { user: true },
            })
            return session ? toSessionWithUser(session) : null
        },
        getSessionById: async (id) => {
            const session = await client.session.findUnique({ where: { id, status: "ACTIVE" } })
            return session ? toSession(session) : null
        },
        listSessions: async (filter) => {
            const sessions = await client.session.findMany({
                where: {
                    userId: filter.userId,
                    ...(filter.status !== undefined && { status: toSessionStatus(filter.status) }),
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
                    status: toSessionStatus(input.status),
                    mfaState: toMFAStatus(input.mfaState),
                    metadata: toJson(input.metadata),
                },
            })
            return toSession(session)
        },
        touchSession: async (id, lastActivityAt) => {
            await client.session.update({
                where: { id, status: "ACTIVE" },
                data: { lastActivityAt },
            })
        },
        revokeSession: async (id, reason) => {
            const existing = await client.session.findUnique({ where: { id } })
            if (!existing) {
                return
            }

            const revokedAt = new Date()
            await client.session.update({
                where: { id },
                data: {
                    status: "REVOKED",
                    revokedAt,
                    metadata: toJson(appendRevokeReason(existing.metadata as Record<string, unknown> | null, reason, revokedAt)),
                },
            })
        },
        revokeAllSessions: async (userId, reason, exceptSessionId) => {
            const sessions = await client.session.findMany({
                where: {
                    userId,
                    status: "ACTIVE",
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
                            status: "REVOKED",
                            revokedAt,
                            metadata: toJson(
                                appendRevokeReason(session.metadata as Record<string, unknown> | null, reason, revokedAt)
                            ),
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
                    type: toDeviceType(input.type),
                    metadata: toJson(input.metadata),
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
                    type: toDeviceType(input.type),
                    metadata: toJson(input.metadata),
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
                    type: toMFAMethod(input.type),
                    credentialData: toJson(input.credentialData),
                    isPrimary: input.isPrimary ?? false,
                    metadata: toJson(input.metadata),
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
                    type: toMFAMethod(type),
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
                    type: toMFAMethod(input.type),
                    credentialData: toJson(input.credentialData),
                    metadata: toJson(input.metadata),
                },
            })
            return toMFACredential(credential)
        },
        deleteMfaCredential: async (id) => {
            await client.mfaCredential.delete({ where: { id } })
        },
        /**
         * OAuth Transactions
         */
        createOAuthTransaction: async (input) => {
            const transaction = await client.oAuthTransaction.create({
                data: {
                    ...input,
                    metadata: toJson(input.metadata),
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
