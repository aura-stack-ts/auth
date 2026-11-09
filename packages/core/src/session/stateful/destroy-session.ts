import type { InternalStatefulContext, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = ({ ctx, cookieManager }: InternalStatefulContext): SessionStrategy["destroySession"] => {
    const { logger, sessionConfig } = ctx

    return async ({ sessionByToken }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "destroySession",
            },
        })
        await sessionConfig.adapter.revokeSession(sessionByToken.id, "user_logout")
        const clearedHeaders = cookieManager.clearAll()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS", {
            structuredData: {
                cookies_cleared: true,
            },
        })
        return clearedHeaders
    }
}
