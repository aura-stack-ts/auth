import { createHash } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmail = ({ ctx }: InternalStatefulContext): SessionStrategy["verifyEmail"] => {
    const { sessionConfig } = ctx
    return async ({ token }) => {
        const tokenHash = await createHash(token)
        const verificationToken = await sessionConfig.adapter.getTokenByHash(tokenHash)
        if (
            !verificationToken ||
            verificationToken.type !== "email_verification" ||
            verificationToken.expiresAt < new Date() ||
            verificationToken.revokedAt
        ) {
            throw new AuraAuthError({ code: "INVALID_EMAIL_VERIFICATION_TOKEN" })
        }

        await sessionConfig.adapter.updateUser(verificationToken.userId, {
            emailVerifiedAt: new Date(),
        })

        await sessionConfig.adapter.revokeToken(verificationToken.id)
    }
}
