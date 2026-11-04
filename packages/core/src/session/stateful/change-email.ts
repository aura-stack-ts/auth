import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue, verifyPassword } from "@/shared/crypto.ts"
import type { SessionStrategy } from "@/@types/session.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const changeEmail = ({ ctx }: InternalStatefulContext): SessionStrategy["changeEmail"] => {
    const { sessionConfig } = ctx
    return async ({ userId, currentPassword, newEmail, origin }) => {
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
        const isEmailRegistered = await sessionConfig.adapter.getUserByEmail(newEmail)
        if (isEmailRegistered) {
            throw new AuraAuthError({ code: "EMAIL_ALREADY_REGISTERED" })
        }
        const user = await sessionConfig.adapter.getUserById(userId)
        if (!user) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = ctx.emailChange?.expiresIn ?? 1800
        await sessionConfig.adapter.createToken({
            userId,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: newEmail,
            type: "email_change",
            tokenHash,
        })
        return {
            token,
            url: `${origin}${ctx.basePath}/email/change/verify?token=${token}`,
            oldEmail: user.email ? user.email : undefined,
        }
    }
}
