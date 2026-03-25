import { getCookie } from "@/cookie.ts"
import { verifyCSRF } from "@/shared/security.ts"
import { getErrorName } from "@/shared/utils.ts"
import { AuthSecurityError } from "@/shared/errors.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type { Session, SessionStrategy, User, TypedJWTPayload, JWTStrategyOptions, GetSessionReturn } from "@/@types/index.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>({
    config,
    jose,
    logger,
    cookies,
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

    const getSession = async (headers: Headers): Promise<GetSessionReturn<DefaultUser>> => {
        const newHeaders = new Headers()
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) return { session: null, headers: newHeaders }

            const {
                exp,
                iat: _iat,
                jti: _jti,
                nbf: _nbf,
                aud: _aud,
                iss: _iss,
                mexp,
                ...user
            } = await jwt.verifyToken(sessionToken)
            if (!user.sub) return { session: null, headers: newHeaders }
            const session: Session<DefaultUser> = {
                user: user as DefaultUser,
                expires: exp ? new Date(exp * 1000).toISOString() : "",
            }

            const expiresAt = updateExpires({ exp })
            if (!expiresAt) return { session, headers: newHeaders }

            const newSession = { ...session, expires: expiresAt.toISOString() }
            const newSessionToken = await jwt.createToken({
                ...(user as DefaultUser),
                exp: Math.floor(expiresAt.getTime() / 1000),
                mexp,
            })
            logger?.log("SESSION_REFRESHED", { structuredData: { strategy: "stateless", expiresAt: expiresAt.toISOString() } })
            return {
                session: newSession,
                headers: cookieConfig.setCookie({ sessionToken: newSessionToken }),
            }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: newHeaders }
        }
    }

    const createSession = async (session: TypedJWTPayload<DefaultUser>) => jwt.createToken(session)

    const refreshSession = async (
        headers: Headers,
        session: Session<DefaultUser>
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            const {
                exp,
                iat: _iat,
                jti: _jti,
                nbf: _nbf,
                aud: _aud,
                iss: _iss,
                mexp,
                ...user
            } = await jwt.verifyToken(sessionToken)
            const updatedSession: Session<DefaultUser> = {
                user: {
                    ...user,
                    ...session.user,
                },
                expires: session.expires ?? exp,
            }
            const newToken = await jwt.createToken({
                ...updatedSession.user,
                exp: new Date(updatedSession.expires).getTime() / 1000,
                mexp,
            })
            return { session: updatedSession, headers: cookieConfig.setCookie({ sessionToken: newToken }) }
        } catch {
            return { session, headers: new Headers() }
        }
    }

    // JWT strategy: stateless tokens cannot be revoked server-side
    const revokeSession = async (_sessionId: string): Promise<void> => {}

    const destroySession = async (headers: Headers, skipCSRFCheck: boolean = false) => {
        let session = null
        let csrfToken = null
        const header = headers.get("X-CSRF-Token")
        try {
            session = getCookie(headers, cookies().sessionToken.name)
        } catch {
            throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
        }
        try {
            csrfToken = getCookie(headers, cookies().csrfToken.name)
        } catch {
            throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
        }
        logger?.log("SIGN_OUT_ATTEMPT", {
            structuredData: {
                has_session: Boolean(session),
                has_csrf_token: Boolean(csrfToken),
                has_csrf_header: Boolean(header),
                skip_csrf_check: skipCSRFCheck,
            },
        })
        if (!session) {
            logger?.log("SESSION_TOKEN_MISSING")
            throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
        }
        if (!skipCSRFCheck) {
            if (!csrfToken) {
                logger?.log("CSRF_TOKEN_MISSING")
                throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
            }
            if (!header) {
                logger?.log("CSRF_HEADER_MISSING")
                throw new AuthSecurityError("CSRF_HEADER_MISSING", "The CSRF header is missing.")
            }
            try {
                await verifyCSRF(jose, csrfToken, header)
            } catch (error) {
                logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
                throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
            }
            logger?.log("SIGN_OUT_CSRF_VERIFIED")
        } else {
            try {
                await jose.verifyJWS(csrfToken)
            } catch (error) {
                logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
                throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
            }
        }
        try {
            await jose.decodeJWT(session)
            logger?.log("SIGN_OUT_SUCCESS")
        } catch (error) {
            logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
        }
        return cookieConfig.clear()
    }

    return { getSession, createSession, refreshSession, revokeSession, destroySession }
}
