import { AuraAuthError } from "@/errors/aura-error.ts"
import { createHash, createSecretValue } from "@/exports/crypto.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const sendMagicLink = (ctx: InternalContextForStateful): SessionStrategy["sendMagicLink"] => {
    const { session } = ctx
    return async ({ email, origin, allowSignUp }) => {
        let user = await session.config.adapter.getUserByEmail(email)
        if (!user) {
            if (!allowSignUp) {
                throw new AuraAuthError({ code: "SIGNUP_NOT_ALLOWED_FOR_MAGIC_LINK" })
            }
            user = await session.config.adapter.createUser({
                email,
                emailVerifiedAt: null,
            })
        } else if (user.status !== "active") {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }
        if (!user.email) {
            throw new AuraAuthError({ code: "SILENT_USER_NOT_FOUND" })
        }

        await session.config.adapter.revokeAllVerificationTokens(user.id, "magic_link")

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = ctx.magicLinks?.expiresIn ?? 1800
        await session.config.adapter.createToken({
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
