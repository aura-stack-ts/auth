import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, hashPassword } from "@/exports/crypto.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const resetPassword = (ctx: InternalContextForStateful): SessionStrategy["resetPassword"] => {
    const { session } = ctx
    return async ({ token, newPassword }) => {
        const tokenHash = await createHash(token)
        const verificationToken = await session.config.adapter.getTokenByHash(tokenHash)

        if (
            !verificationToken ||
            verificationToken.type !== "password_reset" ||
            verificationToken.expiresAt < new Date() ||
            verificationToken.revokedAt
        ) {
            throw new AuraAuthError({ code: "INVALID_RESET_PASSWORD_TOKEN" })
        }

        const accounts = await session.config.adapter.getAccountsByUserId(verificationToken.userId)
        const credentialAccount = accounts.find((acc) => acc.type === "credentials")

        if (!credentialAccount) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }

        /**
         * @todo should support a custom password hashing function, similar to the signInCredentials API ?
         */
        const passwordHash = await hashPassword(newPassword)
        await session.config.adapter.updatePasswordHash(credentialAccount.id, passwordHash)
        await session.config.adapter.revokeToken(verificationToken.id)
        await session.config.adapter.revokeAllSessions(verificationToken.userId, "password_changed")
    }
}
