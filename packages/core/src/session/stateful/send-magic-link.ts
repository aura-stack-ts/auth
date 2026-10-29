import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const sendMagicLink = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async ({
        email,
        request,
        allowSignUp,
    }: {
        email: string
        allowSignUp: boolean
        request: Request
    }): Promise<{ success: true; token: string; url: string } | { success: false; token: null; url: null }> => {
        let user = await sessionConfig.adapter.getUserByEmail(email)
        if (!user) {
            if (!allowSignUp) {
                return { success: false, token: null, url: null }
            }
            user = await sessionConfig.adapter.createUser({
                email,
                emailVerifiedAt: null,
            })
        }
        await sessionConfig.adapter.revokeAllVerificationTokens(user.id, "magic_link")

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        const expiresIn = ctx.magicLinks?.expiresIn ?? 1800
        await sessionConfig.adapter.createToken({
            userId: user.id,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            identifier: email,
            newIdentifier: null,
            type: "magic_link",
            tokenHash,
        })
        const origin = new URL(request.url).origin
        return { success: true, token, url: `${origin}${ctx.basePath}/signIn/magicLink/verify?token=${token}` }
    }
}
