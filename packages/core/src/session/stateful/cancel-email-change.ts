import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const cancelEmailChange = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async ({ token, userId }: { token?: string; userId?: string }): Promise<void> => {
        const now = new Date()
        if (token) {
            const tokenHash = await createHash(token)
            const verificationToken = await sessionConfig.adapter.getTokenByHash(tokenHash)

            if (
                !verificationToken ||
                verificationToken.type !== "email_change_cancel" ||
                verificationToken.expiresAt < now ||
                verificationToken.revokedAt
            ) {
                throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_TOKEN" })
            }
            const userTokens = await sessionConfig.adapter.getTokensByUserId(verificationToken.userId)
            const pending = userTokens.filter(
                (t) =>
                    (t.type === "email_change" || t.type === "email_change_cancel") &&
                    t.newIdentifier === verificationToken.newIdentifier &&
                    !t.revokedAt &&
                    t.expiresAt > now
            )
            await Promise.all(pending.map((t) => sessionConfig.adapter.revokeToken(t.id)))
            return
        }

        if (!userId) {
            throw new AuraAuthError({ code: "USER_NOT_FOUND" })
        }
        const userIdTokens = await sessionConfig.adapter.getTokensByUserId(userId)
        const pending = userIdTokens.filter(
            (t) => (t.type === "email_change" || t.type === "email_change_cancel") && !t.revokedAt && t.expiresAt > now
        )
        await Promise.all(pending.map((t) => sessionConfig.adapter.revokeToken(t.id)))
    }
}
