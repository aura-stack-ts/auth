import type { InternalStatefulContext } from "@/@types/internal.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { hashPassword, verifyPassword } from "@/shared/crypto.ts"

export const changePassword = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx

    return async (userId: string, currentPassword: string, newPassword: string) => {
        const accounts = await sessionConfig.adapter.getAccountsByUserId(userId)
        const credentialAccount = accounts.find((acc) => acc.type === "credentials")
        if (!credentialAccount) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const credential = await sessionConfig.adapter.getCredentialAccount(credentialAccount.id)
        if (!credential) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const isMatch = await verifyPassword(currentPassword, credential.passwordHash)
        if (!isMatch) {
            throw new AuraAuthError({ code: "INVALID_CURRENT_PASSWORD" })
        }
        await sessionConfig.adapter.updatePasswordHash(credentialAccount.id, await hashPassword(newPassword))
    }
}
