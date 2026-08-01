import { getCookie } from "@/cookie.ts"
import { getErrorName } from "@/shared/utils.ts"
import type { InternalStatelessContext } from "@/@types/index.ts"

export const isProviderConnected = ({ ctx, cookies }: InternalStatelessContext) => {
    const { logger, jwtManager: jwt } = ctx

    return async (oauthId: string, headers: Headers): Promise<boolean> => {
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
