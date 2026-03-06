import { getCookie } from "@/cookie.ts"
import { getErrorName, toISOString } from "@/utils.ts"
import type { GlobalContext } from "@aura-stack/router/types"
import type { JWTStandardClaims, SessionResponse, User } from "@/@types/index.ts"

export const getSession = async ({ ctx, headers }: { ctx: GlobalContext; headers: HeadersInit }): Promise<SessionResponse> => {
    try {
        const session = getCookie(new Headers(headers), ctx.cookies.sessionToken.name)
        const decoded = await ctx.jose.decodeJWT(session)
        ctx?.logger?.log("AUTH_SESSION_VALID")
        const { exp, iat, jti, nbf, ...user } = decoded as User & JWTStandardClaims
        return {
            session: {
                user,
                expires: toISOString(exp! * 1000),
            },
            authenticated: true,
        }
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return { session: null, authenticated: false }
    }
}
