import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const sendVerificationEmail = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig, emailVerification, basePath } = ctx
    return async (email: string, request: Request) => {
        const user = await sessionConfig.adapter.getUserByEmail(email)
        if (!user) {
            return { token: null, url: null }
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
        const origin = new URL(request.url).origin
        return { token, url: `${origin}${basePath}/emailVerification/verify?token=${token}` }
    }
}
