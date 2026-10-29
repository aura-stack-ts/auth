import { createHash, createSecretValue, verifyPassword } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const changeEmail = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async (
        userId: string,
        currentPassword: string,
        newEmail: string,
        request: Request
    ): Promise<{ email: string; confirmToken: string; confirmURL: string; cancelToken: string; cancelURL: string }> => {
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
            throw new AuraAuthError({ code: "USER_NOT_FOUND" })
        }
        if (!user.email) {
            throw new AuraAuthError({ code: "USER_EMAIL_NOT_FOUND" })
        }
        const confirmToken = createSecretValue()
        const confirmTokenHash = await createHash(confirmToken)
        const expiresIn = ctx.emailChange?.expiresIn ?? 1800
        await sessionConfig.adapter.createToken({
            userId,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: newEmail,
            type: "email_change",
            tokenHash: confirmTokenHash,
        })

        const cancelToken = createSecretValue()
        const cancelTokenHash = await createHash(cancelToken)
        await sessionConfig.adapter.createToken({
            userId,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: newEmail,
            type: "email_change_cancel",
            tokenHash: cancelTokenHash,
        })
        const origin = new URL(request.url).origin
        return {
            email: user.email,
            confirmToken,
            confirmURL: `${origin}${ctx.basePath}/email/change/verify?token=${confirmToken}`,
            cancelToken,
            cancelURL: `${origin}${ctx.basePath}/email/change/cancel?token=${cancelToken}`,
        }
    }
}
