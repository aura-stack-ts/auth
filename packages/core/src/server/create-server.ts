import { getCookie } from "../cookie.ts"
import { getErrorName, toISOString } from "../utils.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { JWTStandardClaims, SessionResponse, User } from "@/@types/index.ts"

export const createServerAPI = (ctx: Omit<GlobalContext, "server">) => {
    return {
        getSession: async (request: Request): Promise<SessionResponse> => {
            const { cookies, jose, logger } = ctx
            try {
                const session = getCookie(request, cookies.sessionToken.name)
                const decoded = await jose.decodeJWT(session)
                logger?.log("AUTH_SESSION_VALID")
                const { exp, iat, jti, nbf, ...user } = decoded as User & JWTStandardClaims
                return {
                    session: {
                        user,
                        expires: toISOString(exp! * 1000),
                    },
                    authenticated: true,
                }
            } catch (error) {
                logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
                return { session: null, authenticated: false }
            }
        },
    }
}
