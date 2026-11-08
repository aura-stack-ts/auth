import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext, SessionStrategy } from "@/@types/internal.ts"

export const cancelEmailChange = ({ ctx }: InternalStatefulContext): SessionStrategy["cancelEmailChange"] => {
    const { session } = ctx
    return async ({ token, userId }): Promise<void> => {
        const now = new Date()
        if (token) {
            const tokenHash = await createHash(token)
            const verificationToken = await session.config.adapter.getTokenByHash(tokenHash)

            if (
                !verificationToken ||
                verificationToken.type !== "email_change_cancel" ||
                verificationToken.expiresAt < now ||
                verificationToken.revokedAt
            ) {
                throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_TOKEN" })
            }
            const userTokens = await session.config.adapter.getTokensByUserId(verificationToken.userId)
            const pending = userTokens.filter(
                (token) =>
                    (token.type === "email_change" || token.type === "email_change_cancel") &&
                    token.newIdentifier === verificationToken.newIdentifier &&
                    !token.revokedAt &&
                    token.expiresAt > now
            )
            await Promise.all(pending.map((t) => session.config.adapter.revokeToken(t.id)))
            return
        }

        if (!userId) {
            throw new AuraAuthError({ code: "USER_NOT_FOUND" })
        }
        const userIdTokens = await session.config.adapter.getTokensByUserId(userId)
        const pending = userIdTokens.filter(
            (token) =>
                (token.type === "email_change" || token.type === "email_change_cancel") &&
                !token.revokedAt &&
                token.expiresAt > now
        )
        await Promise.all(pending.map((token) => session.config.adapter.revokeToken(token.id)))
    }
}
