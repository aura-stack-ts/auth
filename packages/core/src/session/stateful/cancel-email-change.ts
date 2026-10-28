import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const cancelEmailChange = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async ({ token, userId }: { token?: string; userId?: string }): Promise<void> => {
        if (token) {
            const tokenHash = await createHash(token)
            const verificationToken = await sessionConfig.adapter.getTokenByHash(tokenHash)

            if (
                !verificationToken ||
                verificationToken.type !== "email_change" ||
                verificationToken.expiresAt < new Date() ||
                verificationToken.revokedAt
            ) {
                throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_TOKEN" })
            }
            await sessionConfig.adapter.revokeToken(verificationToken.id)
            return
        }

        if (!userId) {
            throw new AuraAuthError({ code: "USER_NOT_FOUND" })
        }

        const userIdTokens = await sessionConfig.adapter.getTokensByUserId(userId)
        const emailChangeToken = userIdTokens.find((t) => t.type === "email_change" && !t.revokedAt && t.expiresAt > new Date())

        if (emailChangeToken) {
            await sessionConfig.adapter.revokeToken(emailChangeToken.id)
        }
    }
}
