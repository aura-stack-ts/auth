import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, timingSafeEqual } from "@/shared/crypto.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmailChange = ({ ctx }: InternalStatefulContext): SessionStrategy["verifyEmailChange"] => {
    const { sessionConfig } = ctx
    return async ({ userId, sessionId, token }) => {
        const tokenHash = await createHash(token)
        const verifiedToken = await sessionConfig.adapter.getTokenByHash(tokenHash)
        if (
            !verifiedToken ||
            verifiedToken.type !== "email_change" ||
            verifiedToken.expiresAt < new Date() ||
            verifiedToken.revokedAt ||
            !verifiedToken.newIdentifier
        ) {
            throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_TOKEN" })
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
    }
}
