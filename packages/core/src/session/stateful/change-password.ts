import { AuraAuthError } from "@/errors/aura-error.ts"
import { hashPassword, verifyPassword } from "@/shared/crypto.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const changePassword = ({ ctx }: InternalStatefulContext): SessionStrategy["changePassword"] => {
    const { sessionConfig, credentials } = ctx
    const hashPasswordFn = credentials?.hash ?? hashPassword
    const verifyPasswordFn = credentials?.verify ?? verifyPassword

    return async ({ userId, currentPassword, newPassword }) => {
        const accounts = await sessionConfig.adapter.getAccountsByUserId(userId)
        const credentialAccount = accounts.find((acc) => acc.type === "credentials")
        if (!credentialAccount) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const credential = await sessionConfig.adapter.getCredentialAccount(credentialAccount.id)
        if (!credential) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const isMatch = await verifyPasswordFn(currentPassword, credential.passwordHash)
        if (!isMatch) {
            throw new AuraAuthError({ code: "INVALID_CURRENT_PASSWORD" })
        }
        const passwordHash = await hashPasswordFn(newPassword)
        const revokeSessions = await sessionConfig.adapter.revokeAllSessions(userId, "password_changed")
        if (!revokeSessions || revokeSessions === 0) {
            throw new AuraAuthError({ code: "FAILED_TO_REVOKE_SESSIONS_AFTER_PASSWORD_CHANGE" })
        }
        const updatedCredentialAccount = await sessionConfig.adapter.updatePasswordHash(credentialAccount.id, passwordHash)
        if (!updatedCredentialAccount) {
            throw new AuraAuthError({ code: "INVALID_PASSWORD_HASH_IN_PASSWORD_CHANGE" })
        }
    }
}
