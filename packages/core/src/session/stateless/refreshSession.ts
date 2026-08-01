import { getErrorName, verifyCSRFToken } from "@/shared/utils.ts"
import { updateExpires } from "@/shared/utils/session-strategy.ts"
import type { DeepPartial } from "@/@types/utility.ts"
import type { InternalStatelessContext, Session, User } from "@/@types/session.ts"

export const __refreshSession = <DefaultUser extends User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const { logger, jose, jwtManager: jwt, identity, sessionConfig } = ctx

    const maxAge = sessionConfig?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = sessionConfig?.jwt?.expirationStrategy ?? "absolute"

    return async (
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean = false
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        try {
            const { sessionToken } = cookieManager.getCookie(headers)
            if (!sessionToken) {
                return { session: null, headers: cookieManager.clear() }
            }
            const isValidToken = await verifyCSRFToken({
                headers,
                skipCSRFCheck,
                cookies: cookies(),
                jose,
                logger,
            })
            if (!isValidToken) {
                return { session: null, headers: cookieManager.clear() }
            }
            const claims = await jwt.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)

            const { exp, mexp, iat } = parsedClaims
            const defaultPayload = identity.skipValidation ? parsedClaims : await identity.schemaRegistry.parse(parsedClaims)
            const { sub } = defaultPayload
            const sessionPayload = identity.skipValidation
                ? session.user
                : await identity.schemaRegistry.parseAsPartial(session.user)

            const expiresAt = session.expires
                ? new Date(Math.min(Date.now() + maxAge * 1000, new Date(session.expires).getTime()))
                : (updateExpires({ exp, maxAge, strategy }) ?? new Date(Date.now() + maxAge * 1000))
            const updatedSession: Session<DefaultUser> = {
                user: {
                    ...defaultPayload,
                    ...sessionPayload,
                    sub,
                } as DefaultUser,
                expires: expiresAt.toISOString(),
            }
            const verifiedPayload = await identity.schemaRegistry.parse(updatedSession.user)
            const issuedAt = strategy === "absolute" ? iat : Math.floor(Date.now() / 1000)
            const newToken = await jwt.createToken({
                ...verifiedPayload,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp,
            })
            updatedSession.expires = new Date(updatedSession.expires).toISOString()
            return { session: updatedSession, headers: cookieManager.setCookie({ sessionToken: newToken }) }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: cookieManager.clear() }
        }
    }
}
