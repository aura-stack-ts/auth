import { createHash } from "@/exports/crypto.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy, InternalContextForStateful } from "@/@types/internal.ts"

export const verifyEmail = (ctx: InternalContextForStateful): SessionStrategy["verifyEmail"] => {
    const { session } = ctx
    return async ({ token }) => {
        const tokenHash = await createHash(token)
        const verificationToken = await session.config.adapter.getTokenByHash(tokenHash)
        if (
            !verificationToken ||
            verificationToken.type !== "email_verification" ||
            verificationToken.expiresAt < new Date() ||
            verificationToken.revokedAt
        ) {
            throw new AuraAuthError({ code: "INVALID_EMAIL_VERIFICATION_TOKEN" })
        }

        await session.config.adapter.updateUser(verificationToken.userId, {
            emailVerifiedAt: new Date(),
        })

        await session.config.adapter.revokeToken(verificationToken.id)
    }
}
