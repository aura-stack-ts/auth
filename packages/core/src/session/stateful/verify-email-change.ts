import { createHash } from "@/shared/crypto.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const verifyEmailChange = ({ ctx }: InternalStatefulContext) => {
    const { sessionConfig } = ctx
    return async (token: string, request?: Request) => {
        const tokenHash = await createHash(token)
        const verifiedToken = await sessionConfig.adapter.getTokenByHash(tokenHash)
        if (
            !verifiedToken ||
            verifiedToken.type !== "email_change" ||
            verifiedToken.expiresAt < new Date() ||
            verifiedToken.revokedAt
        ) {
            return { success: false }
        }
        if (!verifiedToken.newIdentifier) {
            return { success: false }
        }
        await sessionConfig.adapter.updateUser(verifiedToken.userId, {
            email: verifiedToken.newIdentifier,
            emailVerifiedAt: new Date(),
        })
        await sessionConfig.adapter.revokeToken(verifiedToken.id)

        // Get current session if available to preserve it
        let currentSessionId: string | undefined
        if (request) {
            const sessionToken = request.headers.get("Cookie")?.match(/aura-auth\.session_token=([^;]+)/)?.[1]
            if (sessionToken) {
                const sessionTokenHash = await createHash(sessionToken)
                const session = await sessionConfig.adapter.getSessionByToken(sessionTokenHash)
                if (session) {
                    currentSessionId = session.id
                }
            }
        }

        // Revoke all sessions except the current one
        await sessionConfig.adapter.revokeAllSessions(verifiedToken.userId, "email_changed", currentSessionId)
        return { success: true, userId: verifiedToken.userId }
    }
}
