import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, timingSafeEqual } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmailChange = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async (token: string, userId: string, sessionId: string) => {
        const tokenHash = await createHash(token)
        const verifiedToken = await sessionConfig.adapter.getTokenByHash(tokenHash)
        if (
            !verifiedToken ||
            verifiedToken.type !== "email_change" ||
            verifiedToken.expiresAt < new Date() ||
            verifiedToken.revokedAt
        ) {
            return { success: false }
        }
        if (!verifiedToken.newIdentifier) {
            return { success: false }
        }
        if (!timingSafeEqual(userId, verifiedToken.userId)) {
            throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_TOKEN" })
        }
        await sessionConfig.adapter.revokeToken(verifiedToken.id)
        await sessionConfig.adapter.updateUser(userId, {
            email: verifiedToken.newIdentifier,
            emailVerifiedAt: new Date(),
        })
        await sessionConfig.adapter.revokeAllSessions(userId, "email_changed", sessionId)
        return { success: true, userId: userId }
    }
}
