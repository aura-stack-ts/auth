import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/shared/http/cookie.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"
import type { SessionWithUserEntity } from "@/@types/entities.ts"

export const destroySession = (ctx: InternalContextForStateful): SessionStrategy["destroySession"] => {
    const { logger, session } = ctx

    return async ({ headers, rawSession, cookieStore }) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START")
        const sessionByToken = rawSession as SessionWithUserEntity
        await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS")
        return {
            headers: new HeadersBuilder(headers)
                .setCookie(cookieStore.csrfToken.name, "", getExpiredCookie(cookieStore.csrfToken.attributes))
                .setCookie(cookieStore.sessionToken.name, "", getExpiredCookie(cookieStore.sessionToken.attributes))
                .toHeaders(),
        }
    }
}
