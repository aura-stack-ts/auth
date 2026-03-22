import { getCookie } from "@/cookie.ts"
import { verifyCSRF } from "@/secure.ts"
import { getErrorName } from "@/utils.ts"
import { AuthSecurityError } from "@/errors.ts"
import { createJoseManager } from "@/session/manager/jose.ts"
import { createCookieManager } from "@/session/manager/cookie.ts"
import type { Session, SessionStrategy, User, TypedJWTPayload, JWTStrategyOptions } from "@/@types/index.ts"

export const createStatelessStrategy = ({ config, jose, logger, cookies }: JWTStrategyOptions): SessionStrategy => {
    const jwt = createJoseManager(config?.jwt, jose)
    const cookieConfig = createCookieManager(cookies)

    const getSession = async (headers: Headers): Promise<Session | null> => {
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) return null

            const decoded = await jwt.verifyToken(sessionToken)
            const { exp, iat: _iat, jti: _jti, nbf: _nbf, aud: _aud, iss: _iss, ...user } = decoded

            if (!user.sub) return null

            return {
                user,
                expires: exp ? new Date(exp * 1000).toISOString() : "",
            }
        } catch {
            return null
        }
    }

    const createSession = async (session: TypedJWTPayload<User>) => jwt.createToken(session)

    /** @todo: implement refresh session logic */
    const refreshSession = async (_headers: Headers): Promise<Session | null> => {
        // JWT strategy: refresh not implemented; return null per interface contract
        return null
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
