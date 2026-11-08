import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { SessionStrategy, InternalStatefulContext } from "@/@types/internal.ts"

export const forgotPassword = ({ ctx }: InternalStatefulContext): SessionStrategy["forgotPassword"] => {
    const { session, passwordReset, basePath } = ctx
    return async ({ email, origin }) => {
        const user = await session.config.adapter.getUserByEmail(email)
        if (!user) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = passwordReset?.expiresIn ?? 1800
        await session.config.adapter.createToken({
            userId: user.id,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: email,
            newIdentifier: null,
            type: "password_reset",
            tokenHash,
        })
        return { token, url: `${origin}${basePath}${passwordReset?.path || "/password-reset"}?token=${token}` }
    }
}
