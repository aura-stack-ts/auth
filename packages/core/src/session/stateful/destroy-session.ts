import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = (ctx: InternalContextForStateful): SessionStrategy["destroySession"] => {
    const { logger, session } = ctx

    return async ({ sessionByToken }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START")
        await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
        const clearedHeaders = ctx.cookies.manager.clearAll()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS")
        return clearedHeaders
    }
}
