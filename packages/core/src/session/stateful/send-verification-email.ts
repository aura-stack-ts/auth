import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const sendVerificationEmail = (ctx: InternalContextForStateful): SessionStrategy["sendVerificationEmail"] => {
    const { session, emailVerification, basePath } = ctx
    return async ({ email, origin }) => {
        const user = await session.config.adapter.getUserByEmail(email)
        if (!user) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = emailVerification?.expiresIn ?? 1800
        await session.config.adapter.createToken({
            userId: user.id,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: email,
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        return { token, url: `${origin}${basePath}/emailVerification/verify?token=${token}` }
    }
}
