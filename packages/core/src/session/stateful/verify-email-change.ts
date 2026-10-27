import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmailChange = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async (token: string, sessionId: string) => {
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
        await sessionConfig.adapter.updateUser(verifiedToken.userId, {
            email: verifiedToken.newIdentifier,
            emailVerifiedAt: new Date(),
        })
        await sessionConfig.adapter.revokeToken(verifiedToken.id)
        await sessionConfig.adapter.revokeAllSessions(verifiedToken.userId, "email_changed", sessionId)
        return { success: true, userId: verifiedToken.userId }
    }
}
