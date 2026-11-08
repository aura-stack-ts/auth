import type { InternalStatefulContext, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = ({ ctx }: InternalStatefulContext): SessionStrategy["destroySession"] => {
    const { logger, session } = ctx

    return async ({ sessionByToken }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "destroySession",
            },
        })
        await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
        const clearedHeaders = ctx.cookies.manager.clearAll()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS", {
            structuredData: {
                cookies_cleared: true,
            },
        })
        return clearedHeaders
    }
}
