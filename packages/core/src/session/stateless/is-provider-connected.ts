import { getCookie } from "@/shared/http/cookie.ts"
import { getErrorName } from "@/errors/aura-error.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const isProviderConnected = ({ ctx, cookies }: InternalStatelessContext): SessionStrategy["isProviderConnected"] => {
    const { logger, jwtManager: jwt } = ctx

    return async ({ oauthId, headers }) => {
        const cookieName = `${cookies().accessToken.name}.${oauthId}`
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
            const decodedToken = await jwt.verifyToken(cookieValue)
            return !!decodedToken
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return false
        }
    }
}
