import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue, verifyPassword } from "@/exports/crypto.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const changeEmail = (ctx: InternalContextForStateful): SessionStrategy["changeEmail"] => {
    const { session } = ctx
    return async ({ userId, currentPassword, newEmail, origin }) => {
        const normalizedNewEmail = newEmail.trim().toLowerCase()
        if (!normalizedNewEmail) {
            throw new AuraAuthError({ code: "INVALID_EMAIL_VALUE" })
        }
        const accounts = await session.config.adapter.getAccountsByUserId(userId)
        const credentialAccount = accounts.find((acc) => acc.type === "credentials")
        if (!credentialAccount) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const credential = await session.config.adapter.getCredentialAccount(credentialAccount.id)
        if (!credential) {
            throw new AuraAuthError({ code: "NO_CREDENTIALS_ACCOUNT_FOUND" })
        }
        const isMatch = await verifyPassword(currentPassword, credential.passwordHash)
        if (!isMatch) {
            throw new AuraAuthError({ code: "INVALID_CURRENT_PASSWORD" })
        }
        const isEmailRegistered = await session.config.adapter.getUserByEmail(normalizedNewEmail)
        if (isEmailRegistered) {
            throw new AuraAuthError({ code: "EMAIL_ALREADY_REGISTERED" })
        }
        const user = await session.config.adapter.getUserById(userId)
        if (!user) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        if (!user.email) {
            throw new AuraAuthError({ code: "USER_EMAIL_NOT_FOUND" })
        }
        await Promise.all([
            await session.config.adapter.revokeAllVerificationTokens(userId, "email_change"),
            await session.config.adapter.revokeAllVerificationTokens(userId, "email_change_cancel"),
        ])

        const confirmToken = createSecretValue()
        const confirmTokenHash = await createHash(confirmToken)
        const expiresIn = ctx.emailChange?.expiresIn ?? 1800
        await session.config.adapter.createToken({
            userId,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: normalizedNewEmail,
            type: "email_change",
            tokenHash: confirmTokenHash,
        })

        const cancelToken = createSecretValue()
        const cancelTokenHash = await createHash(cancelToken)
        await session.config.adapter.createToken({
            userId,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: normalizedNewEmail,
            type: "email_change_cancel",
            tokenHash: cancelTokenHash,
        })
        return {
            email: user.email,
            confirmToken,
            confirmURL: `${origin}${ctx.basePath}/email/change/verify?token=${confirmToken}`,
            cancelToken,
            cancelURL: `${origin}${ctx.basePath}/email/change/cancel?token=${cancelToken}`,
        }
    }
}
