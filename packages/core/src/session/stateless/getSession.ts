import { getErrorName } from "@/shared/utils.ts"
import type { GetStatelessSessionReturn, InternalStatelessContext, Session, User } from "@/@types/session.ts"

const updateExpires = ({ exp, maxAge, strategy }: { exp: number | undefined; maxAge: number; strategy: string }): Date | null => {
    if (!exp) return null
    const now = Math.floor(Date.now() / 1000)
    switch (strategy) {
        case "fixed":
        case "absolute":
            return null
        case "rolling":
            return new Date((now + maxAge) * 1000)
        case "sliding": {
            const threshold = maxAge * 0.25
            if (exp - now < threshold) {
                return new Date((now + maxAge) * 1000)
            }
            return null
        }
        default:
            return null
    }
}

export const __getSession = <DefaultUser extends User>({ ctx, cookieManager }: InternalStatelessContext) => {
    const { logger, identity, jwtManager, sessionConfig } = ctx

    const maxAge = sessionConfig?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = sessionConfig?.jwt?.expirationStrategy ?? "absolute"

    return async (headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>> => {
        const newHeaders = new Headers()
        try {
            const { sessionToken } = cookieManager.getCookie(headers)
            if (!sessionToken) return { session: null, headers: newHeaders }

            const claims = await jwtManager.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)
            const { exp, iat: _iat, mexp: _mexp, ...defaultPayload } = parsedClaims
            const userClaims = await identity.schemaRegistry.parse(defaultPayload)
            if (!userClaims.sub) return { session: null, headers: newHeaders }

            const session: Session<DefaultUser> = {
                user: userClaims as DefaultUser,
                expires: parsedClaims.exp ? new Date(exp * 1000).toISOString() : "",
            }

            const expiresAt = updateExpires({ exp, maxAge, strategy })
            if (!expiresAt) {
                return { session: { expires: session.expires, user: userClaims }, headers }
            }

            const issuedAt = strategy === "absolute" ? parsedClaims.iat : Math.floor(Date.now() / 1000)
            const newSessionToken = await jwtManager.createToken({
                ...userClaims,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp: parsedClaims.mexp,
            })
            logger?.log("SESSION_REFRESHED", { structuredData: { strategy: "stateless", expiresAt: expiresAt.toISOString() } })
            return {
                session: {
                    user: userClaims,
                    expires: expiresAt.toISOString(),
                } as unknown as Session<DefaultUser>,
                headers: cookieManager.setCookie({ sessionToken: newSessionToken }),
            }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: newHeaders }
        }
    }
}
