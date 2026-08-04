import { getErrorName } from "@/shared/utils.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { isInvalidSlidingThreshold } from "@/shared/assert.ts"
import { calcStatelessExpiration } from "@/shared/utils/session-strategy.ts"
import type { GetStatelessSessionReturn, InternalStatelessContext, Session, User } from "@/@types/index.ts"

export const getSession = <DefaultUser extends User>({ ctx, cookieManager }: InternalStatelessContext) => {
    const { logger, identity, jwtManager, sessionConfig } = ctx

    const maxAge = sessionConfig?.maxAge ?? sessionConfig?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = sessionConfig?.expirationStrategy ?? sessionConfig?.jwt?.expirationStrategy ?? "absolute"
    const slidingThreshold = sessionConfig?.slidingThreshold
    if (isInvalidSlidingThreshold(slidingThreshold)) {
        throw new AuraAuthError({ code: "INVALID_SLIDING_THRESHOLD_CONFIG_VALUE" })
    }

    return async (headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>> => {
        const newHeaders = new Headers(secureApiHeaders)
        try {
            const { sessionToken } = cookieManager.getCookie(headers)
            if (!sessionToken) return { session: null, headers: newHeaders }

            const claims = await jwtManager.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)
            const { exp, iat: _iat, mexp: _mexp, ...defaultPayload } = parsedClaims
            const userClaims = identity.skipValidation ? defaultPayload : await identity.schemaRegistry.parse(defaultPayload)
            if (!userClaims.sub) return { session: null, headers: newHeaders }

            const session: Session<DefaultUser> = {
                user: userClaims as DefaultUser,
                expires: parsedClaims.exp ? new Date(exp * 1000).toISOString() : "",
            }

            const calc = calcStatelessExpiration({
                exp,
                maxAge,
                strategy,
                slidingThreshold,
            })
            if (calc.action === "invalid") {
                return { session: null, headers: newHeaders }
            }
            if (calc.action === "no_change" || calc.action === "touch") {
                return { session, headers }
            }
            const expiresAt = calc.expiresAt
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
