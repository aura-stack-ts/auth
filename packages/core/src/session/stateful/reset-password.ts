import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, hashPassword } from "@/shared/crypto.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const resetPassword = ({ ctx }: InternalStatefulContext): SessionStrategy["resetPassword"] => {
    const { sessionConfig } = ctx
    return async ({ token, newPassword }) => {
        const tokenHash = await createHash(token)
        const verificationToken = await sessionConfig.adapter.getTokenByHash(tokenHash)

        if (
            !verificationToken ||
            verificationToken.type !== "password_reset" ||
            verificationToken.expiresAt < new Date() ||
            verificationToken.revokedAt
        ) {
            throw new AuraAuthError({ code: "INVALID_RESET_PASSWORD_TOKEN" })
        }

        const accounts = await sessionConfig.adapter.getAccountsByUserId(verificationToken.userId)
        const credentialAccount = accounts.find((acc) => acc.type === "credentials")

        if (!credentialAccount) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }

        /**
         * @todo should support a custom password hashing function, similar to the signInCredentials API ?
         */
        const passwordHash = await hashPassword(newPassword)
        await sessionConfig.adapter.updatePasswordHash(credentialAccount.id, passwordHash)
        await sessionConfig.adapter.revokeToken(verificationToken.id)
        await sessionConfig.adapter.revokeAllSessions(verificationToken.userId, "password_changed")
    }
}
