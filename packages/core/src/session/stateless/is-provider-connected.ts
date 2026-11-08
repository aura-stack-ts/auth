import { getCookie } from "@/shared/http/cookie.ts"
import { getErrorName } from "@/errors/aura-error.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const isProviderConnected = (ctx: InternalContextForStateless): SessionStrategy["isProviderConnected"] => {
    const { logger, jose } = ctx

    return async ({ oauthId, headers }) => {
        const cookieName = `${ctx.cookies.store.accessToken.name}.${oauthId}`
        let cookieValue: string
        try {
            cookieValue = getCookie(headers, cookieName)
        } catch {
            logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauthId, hasCookie: false },
            })
            return false
        }

        try {
            const decodedToken = await jose.manager.verifyToken(cookieValue)
            return !!decodedToken
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return false
        }
    }
}
