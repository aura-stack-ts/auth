import { verifyCSRFToken, getErrorName, verifySessionToken } from "@/shared/utils.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type {
    Session,
    SessionStrategy,
    User,
    TypedJWTPayload,
    JWTStrategyOptions,
    GetStatelessSessionReturn,
    DeepPartial,
    JoseInstance,
} from "@/@types/index.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>({
    config,
    jose,
    logger,
    cookies,
    identity,
}: JWTStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const jwt = createJoseManager<DefaultUser>(config?.jwt, jose)
    const cookieConfig = createCookieManager(cookies)
    const maxAge = config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = config?.jwt?.expirationStrategy ?? "absolute"

    const updateExpires = ({ exp }: { exp: number | undefined }): Date | null => {
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

    const getSession = async (headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>> => {
        const newHeaders = new Headers()
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) return { session: null, headers: newHeaders }

            const claims = await jwt.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)
            const { exp, iat: _iat, mexp: _mexp, ...defaultPayload } = parsedClaims
            const userClaims = await identity.schemaRegistry.parse(defaultPayload)
            if (!userClaims.sub) return { session: null, headers: newHeaders }

            const session: Session<DefaultUser> = {
                user: userClaims as DefaultUser,
                expires: parsedClaims.exp ? new Date(exp * 1000).toISOString() : "",
            }

            const expiresAt = updateExpires({ exp })
            if (!expiresAt) {
                return { session: { expires: session.expires, user: userClaims }, headers }
            }

            const issuedAt = strategy === "absolute" ? parsedClaims.iat : Math.floor(Date.now() / 1000)
            const newSessionToken = await jwt.createToken({
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
                headers: cookieConfig.setCookie({ sessionToken: newSessionToken }),
            }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: newHeaders }
        }
    }

    const createSession = async (session: TypedJWTPayload<DefaultUser>) => {
        if (identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }
        const payload = identity.skipValidation ? session : await identity.schemaRegistry.parse(session)
        return jwt.createToken(payload as unknown as DefaultUser)
    }

    const refreshSession = async (
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean = false
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) {
                return { session: null, headers: cookieConfig.clear() }
            }
            const isValidToken = await verifyCSRFToken({
                headers,
                skipCSRFCheck,
                cookies: cookies(),
                logger,
                jose: jose as JoseInstance,
            })
            if (!isValidToken) {
                return { session: null, headers: cookieConfig.clear() }
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
                : (updateExpires({ exp }) ?? new Date(Date.now() + maxAge * 1000))
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
            return { session: updatedSession, headers: cookieConfig.setCookie({ sessionToken: newToken }) }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: cookieConfig.clear() }
        }
    }

    // JWT strategy: stateless tokens cannot be revoked server-side
    const revokeSession = async (_sessionId: string): Promise<void> => {}

    const destroySession = async (headers: Headers, skipCSRFCheck: boolean = false) => {
        await verifyCSRFToken({ headers, skipCSRFCheck, cookies: cookies(), logger, jose: jose as JoseInstance })
        await verifySessionToken({ headers, cookies: cookies(), jwt, logger })
        return cookieConfig.clear()
    }

    return { getSession, createSession, refreshSession, revokeSession, destroySession }
}
