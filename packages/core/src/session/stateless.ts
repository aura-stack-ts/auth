import { getCookie } from "@/cookie.ts"
import { verifyCSRF } from "@/shared/crypto.ts"
import { getErrorName } from "@/shared/utils.ts"
import { AuthSecurityError } from "@/shared/errors.ts"
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
} from "@/@types/index.ts"
import { createSchemaRegistry } from "@/schema-registry.ts"

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
    const schema = createSchemaRegistry(identity)

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

    const verifyCSRFToken = async (headers: Headers, skipCSRFCheck: boolean = false): Promise<boolean> => {
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
        logger?.log("CSRF_TOKEN_REQUESTED", {
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
            logger?.log("CSRF_TOKEN_VERIFIED")
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
            return true
        } catch (error) {
            logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
            return false
        }
    }

    const getSession = async (headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>> => {
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
            if (!expiresAt) {
                const userSession = identity.skipValidation
                    ? session.user
                    : await schema.parse<TypedJWTPayload<DefaultUser>>(session.user)
                return { session: { expires: session.expires, user: userSession }, headers }
            }

            const newSessionPayload = identity.skipValidation
                ? session.user
                : await schema.parse<TypedJWTPayload<DefaultUser>>(session.user)
            const newSession = { user: newSessionPayload, expires: expiresAt.toISOString() }

            const issuedAt = strategy === "absolute" ? _iat : Math.floor(Date.now() / 1000)
            const newSessionToken = await jwt.createToken({
                ...newSessionPayload,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp,
            })
            logger?.log("SESSION_REFRESHED", { structuredData: { strategy: "stateless", expiresAt: expiresAt.toISOString() } })
            return {
                session: newSession as unknown as Session<DefaultUser>,
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
        const payload = identity.skipValidation ? session : await schema.parse<TypedJWTPayload<DefaultUser>>(session)
        return jwt.createToken(payload)
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
            const isValidToken = await verifyCSRFToken(headers, skipCSRFCheck)
            if (!isValidToken) {
                return { session: null, headers: cookieConfig.clear() }
            }
            const verifiedToken = await jwt.verifyToken(sessionToken)
            const { exp, mexp, sub, iat } = verifiedToken
            const defaultPayload = identity.skipValidation ? verifiedToken : await schema.parse(verifiedToken)
            const sessionPayload = identity.skipValidation ? session.user : await schema.parseAsPartial(session.user)

            const expiresAt = session.expires
                ? new Date(session.expires)
                : (updateExpires({ exp }) ?? new Date(Date.now() + maxAge * 1000))
            const updatedSession: Session<DefaultUser> = {
                user: {
                    ...defaultPayload,
                    ...sessionPayload,
                    sub,
                } as DefaultUser,
                expires: expiresAt.toISOString(),
            }
            const issuedAt = strategy === "absolute" ? iat : Math.floor(Date.now() / 1000)
            const newToken = await jwt.createToken({
                ...updatedSession.user,
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
        await verifyCSRFToken(headers, skipCSRFCheck)
        return cookieConfig.clear()
    }

    return { getSession, createSession, refreshSession, revokeSession, destroySession }
}
