import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import { createDevice as createDeviceRegistry } from "@/shared/utils/session-strategy.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const verifyMagicLink = ({ ctx, cookies, cookieManager }: InternalStatefulContext): SessionStrategy["verifyMagicLink"] => {
    const { sessionConfig } = ctx
    const createDevice = createDeviceRegistry({ ctx, cookies, cookieManager })

    return async ({ token, request }) => {
        const now = new Date()
        const tokenHash = await createHash(token)
        const verifiedToken = await sessionConfig.adapter.getTokenByHash(tokenHash)

        if (!verifiedToken || verifiedToken.type !== "magic_link" || verifiedToken.expiresAt < now || verifiedToken.revokedAt) {
            throw new AuraAuthError({ code: "INVALID_MAGIC_LINK_TOKEN" })
        }
        const isTokenRevoked = await sessionConfig.adapter.revokeToken(verifiedToken.id)
        if (!isTokenRevoked) {
            throw new AuraAuthError({ code: "INVALID_MAGIC_LINK_TOKEN" })
        }
        const user = await sessionConfig.adapter.getUserById(verifiedToken.userId)
        if (!user || user.status !== "active" || user.email !== verifiedToken.identifier) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }

        await sessionConfig.adapter.revokeAllVerificationTokens(verifiedToken.userId, "magic_link")

        await sessionConfig.adapter.updateUser(verifiedToken.userId, {
            emailVerifiedAt: new Date(),
        })

        const existingAccounts = await sessionConfig.adapter.getAccountsByUserId(verifiedToken.userId)
        const hasMagicLinkAccount = existingAccounts.some((acc) => acc.provider === "magic_link")

        if (!hasMagicLinkAccount) {
            await sessionConfig.adapter.createAccount({
                userId: verifiedToken.userId,
                provider: "magic_link",
                status: "active",
                type: "magic_link",
                providerUserId: verifiedToken.userId,
            })
        }

        const device = await createDevice(verifiedToken.userId, request)
        const maxAge = sessionConfig.maxAge ?? 60 * 60 * 24 * 15
        const expiresAt = new Date(Date.now() + maxAge * 1000)

        const sessionToken = createSecretValue(64)
        const sessionTokenHash = await createHash(sessionToken)

        await sessionConfig.adapter.createSession({
            id: createSecretValue(32),
            userId: verifiedToken.userId,
            deviceId: device.id,
            authenticatedWith: "magic_link",
            status: "active",
            mfaState: "none",
            tokenHash: sessionTokenHash,
            expiresAt,
        })

        return { sessionToken }
    }
}
