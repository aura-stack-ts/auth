import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { SessionStrategy } from "@/@types/session.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const sendMagicLink = ({ ctx }: InternalStatefulContext): SessionStrategy["sendMagicLink"] => {
    const { sessionConfig } = ctx
    return async ({ email, origin, allowSignUp }) => {
        let user = await sessionConfig.adapter.getUserByEmail(email)
        if (!user) {
            if (!allowSignUp) {
                throw new AuraAuthError({ code: "SIGNUP_NOT_ALLOWED_FOR_MAGIC_LINK" })
            }
            user = await sessionConfig.adapter.createUser({
                email,
                emailVerifiedAt: null,
            })
        } else if (user.status !== "active") {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        if (!user.email) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }

        await sessionConfig.adapter.revokeAllVerificationTokens(user.id, "magic_link")

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = ctx.magicLinks?.expiresIn ?? 1800
        await sessionConfig.adapter.createToken({
            userId: user.id,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: user.email,
            newIdentifier: null,
            type: "magic_link",
            tokenHash,
        })
        return { token, url: `${origin}${ctx.basePath}/signIn/magicLink/verify?token=${token}` }
    }
}
