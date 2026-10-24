import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmail = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async (token: string) => {
        const tokenHash = await createHash(token)
        const verificationToken = await sessionConfig.adapter.getTokenByHash(tokenHash)
        if (
            !verificationToken ||
            verificationToken.type !== "email_verification" ||
            verificationToken.expiresAt < new Date() ||
            verificationToken.revokedAt
        ) {
            return { success: false }
        }

        await sessionConfig.adapter.updateUser(verificationToken.userId, {
            emailVerifiedAt: new Date(),
        })

        await sessionConfig.adapter.revokeToken(verificationToken.id)

        return { success: true }
    }
}
