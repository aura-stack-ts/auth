import { toUnionHeaders } from "@/shared/http/headers.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = (ctx: InternalContextForStateful): SessionStrategy["destroySession"] => {
    const { logger, session } = ctx

    return async ({ headers, sessionByToken }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START")
        await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS")
        return { headers: toUnionHeaders(headers, ctx.cookies.manager.clearAll()) }
    }
}
