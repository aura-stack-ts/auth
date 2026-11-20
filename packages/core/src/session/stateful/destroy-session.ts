import { toUnionHeaders } from "@/shared/http/headers.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"
import type { SessionWithUserEntity } from "@/@types/entities.ts"

export const destroySession = (ctx: InternalContextForStateful): SessionStrategy["destroySession"] => {
    const { logger, session } = ctx

    return async ({ headers, rawSession }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START")
        const sessionByToken = rawSession as SessionWithUserEntity
        await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS")
        return { headers: toUnionHeaders(headers, ctx.cookies.manager.clearAll()) }
    }
}
