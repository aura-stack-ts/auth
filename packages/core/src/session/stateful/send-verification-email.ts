import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { SessionStrategy } from "@/@types/session.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const sendVerificationEmail = ({ ctx }: InternalStatefulContext): SessionStrategy["sendVerificationEmail"] => {
    const { sessionConfig, emailVerification, basePath } = ctx
    return async (email: string, originURL: string) => {
        const user = await sessionConfig.adapter.getUserByEmail(email)
        if (!user) {
            throw new AuraAuthError({ code: "USER_NOT_FOUND" })
        }
        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = emailVerification?.expiresIn ?? 1800
        await sessionConfig.adapter.createToken({
            userId: user?.id,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: email,
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        return { token, url: `${originURL}${basePath}/emailVerification/verify?token=${token}` }
    }
}
