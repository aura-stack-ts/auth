import { createHash } from "@aura-stack/auth/crypto"
import type { DatabaseAdapter } from "@aura-stack/auth/types"
import type { PrismaClient } from "@/generated/prisma/client.js"
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
    toMFASatus,
    toOAuthAccount,
    toOAuthTransaction,
    toSession,
    toSessionStatus,
    toSessionWithUser,
    toUser,
    toUserStatus,
    toJson,
} from "@/mappers.ts"

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
            const user = await client.user.update({
                where: { id },
                data: {
                    name: input.name,
                    email: input.email,
                    image: input.image,
                    emailVerifiedAt: input.emailVerifiedAt,
                    status: input.status ? toUserStatus(input.status) : undefined,
                    mfaEnabled: input.mfaEnabled,
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
                return
            }

            await client.user.update({
                where: { id },
                data: { status: "DELETED" },
            })
        },

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

        createOAuthAccount: async (input) => {
            const account = await client.oAuthAccount.create({
                data: {
                    accountId: input.accountId!,
                    accessToken: input.accessToken ?? "",
                    refreshToken: input.refreshToken ?? null,
                    idToken: input.idToken ?? null,
                    tokenType: input.tokenType ?? null,
                    scopes: input.scopes ?? null,
                    issuer: input.issuer ?? null,
                    accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
                    refreshTokenExpiresAt: input.refreshTokenExpiresAt ?? null,
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
            const account = await client.oAuthAccount.update({
                where: { accountId },
                data: {
                    accessToken: input.accessToken,
                    refreshToken: input.refreshToken,
                    idToken: input.idToken,
                    tokenType: input.tokenType,
                    scopes: input.scopes,
                    issuer: input.issuer,
                    accessTokenExpiresAt: input.accessTokenExpiresAt,
                    refreshTokenExpiresAt: input.refreshTokenExpiresAt,
                },
            })
            return toOAuthAccount(account)
        },

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

        createSession: async (input) => {
            const session = await client.session.create({
                data: {
                    id: input.id,
                    userId: input.userId,
                    deviceId: input.deviceId,
                    authenticatedWith: input.authenticatedWith,
                    status: toSessionStatus(input.status),
                    mfaState: toMFASatus(input.mfaState),
                    tokenHash: input.tokenHash,
                    expiresAt: input.expiresAt,
                    metadata: toJson(input.metadata),
                    lastActivityAt: new Date(),
                },
            })
            return toSession(session)
        },

        getSessionByToken: async (token) => {
            const tokenHash = await createHash(token)
            const session = await client.session.findUnique({
                where: { tokenHash },
                include: { user: true },
            })

            if (!session) {
                return null
            }
            return toSessionWithUser(session)
        },

        getSessionById: async (id) => {
            const session = await client.session.findUnique({ where: { id } })
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
            const session = await client.session.update({
                where: { id },
                data: {
                    userId: input.userId,
                    deviceId: input.deviceId,
                    authenticatedWith: input.authenticatedWith,
                    status: toSessionStatus(input.status),
                    mfaState: toMFASatus(input.mfaState),
                    tokenHash: input.tokenHash,
                    expiresAt: input.expiresAt,
                    metadata: toJson(input.metadata),
                },
            })
            return toSession(session)
        },

        touchSession: async (id, lastActivityAt) => {
            await client.session.update({
                where: { id },
                data: { lastActivityAt },
            })
        },

        revokeSession: async (id, reason) => {
            const existing = await client.session.findUnique({ where: { id } })
            if (!existing) {
                return
            }

            await client.session.update({
                where: { id },
                data: {
                    status: "REVOKED",
                    revokedAt: new Date(),
                    metadata: toJson(appendRevokeReason(existing.metadata as Record<string, unknown> | null, reason)),
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
                            metadata: toJson(appendRevokeReason(session.metadata as Record<string, unknown> | null, reason)),
                        },
                    })
                )
            )

            return sessions.length
        },

        createDevice: async (input) => {
            const device = await client.device.create({
                data: {
                    id: input.id,
                    userId: input.userId,
                    name: input.name,
                    type: toDeviceType(input.type),
                    platform: input.platform,
                    browser: input.browser,
                    userAgent: input.userAgent,
                    fingerprint: input.fingerprint,
                    lastIp: input.lastIp,
                    trusted: input.trusted,
                    firstSeenAt: input.firstSeenAt,
                    lastSeenAt: input.lastSeenAt,
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
            const device = await client.device.update({
                where: { id },
                data: {
                    userId: input.userId,
                    name: input.name,
                    type: toDeviceType(input.type),
                    platform: input.platform,
                    browser: input.browser,
                    userAgent: input.userAgent,
                    fingerprint: input.fingerprint,
                    lastIp: input.lastIp,
                    trusted: input.trusted,
                    firstSeenAt: input.firstSeenAt,
                    lastSeenAt: input.lastSeenAt,
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
                    isPrimary: input.isPrimary,
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
            const credential = await client.mfaCredential.update({
                where: { id },
                data: {
                    userId: input.userId,
                    type: toMFAMethod(input.type),
                    credentialData: toJson(input.credentialData),
                    isPrimary: input.isPrimary,
                    metadata: toJson(input.metadata),
                },
            })
            return toMFACredential(credential)
        },

        deleteMfaCredential: async (id) => {
            await client.mfaCredential.delete({ where: { id } })
        },

        createOAuthTransaction: async (input) => {
            const transaction = await client.oAuthTransaction.create({
                data: {
                    id: input.id,
                    provider: input.provider,
                    state: input.state,
                    nonce: input.nonce,
                    codeVerifier: input.codeVerifier,
                    redirectUri: input.redirectUri,
                    redirectTo: input.redirectTo,
                    userAgent: input.userAgent,
                    fingerprint: input.fingerprint,
                    deviceId: input.deviceId,
                    expiresAt: input.expiresAt,
                    metadata: toJson(input.metadata),
                },
            })
            return toOAuthTransaction(transaction)
        },

        getOAuthTransactionByState: async (state) => {
            const transaction = await client.oAuthTransaction.findUnique({ where: { state } })
            return transaction ? toOAuthTransaction(transaction) : null
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
