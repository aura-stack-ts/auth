import { createHash } from "@/exports/crypto.ts"
import { getOptionalCookie } from "@/shared/http/cookie.ts"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { isJWTExpired, isStatelessStrategy } from "@/shared/assert.ts"
import type { FunctionAPIContext, InternalCookieStoreConfig, JoseManager } from "@/@types/internal.ts"
import type { APIOptionsWithRequest } from "@/@types/api.ts"

export const verifyStatelessSessionToken = async ({
    headers,
    cookies,
    jwt,
    outHeaders,
}: {
    headers: Headers
    jwt: JoseManager
    cookies: InternalCookieStoreConfig
    outHeaders: Headers
}) => {
    const token = getOptionalCookie(headers, cookies.sessionToken.name)
    if (!token) throw new AuraAuthError({ code: "SESSION_MISSING" })
    try {
        const session = await jwt.verifyToken(token)
        return { session, sessionToken: token }
    } catch (error) {
        if (isJWTExpired(error)) {
            throw new AuraAuthError({ code: "SESSION_EXPIRED", headers: outHeaders })
        }
        throw new AuraAuthError({ code: "SESSION_INVALID", cause: error, headers: outHeaders })
    }
}

export const verifyStatefulSessionToken = async ({
    context,
    headers,
    cookies,
}: {
    context: FunctionAPIContext<APIOptionsWithRequest>
    headers: Headers
    cookies: InternalCookieStoreConfig
}) => {
    if (isStatelessStrategy(context.ctx.session.config)) {
        throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
    const { sessionToken } = context.ctx.cookies.manager.getCookie(headers, cookies)
    const outHeaders = context.ctx.cookies.manager.clear(cookies)
    if (!sessionToken) {
        throw new AuraAuthError({ code: "SESSION_MISSING" })
    }
    const tokenHash = await createHash(sessionToken)
    const session = await context.ctx.session.config.adapter.getSessionByToken(tokenHash)
    if (!session) {
        throw new AuraAuthError({ code: "SESSION_NOT_FOUND", headers: outHeaders })
    }
    if (session.revokedAt || session.status === "revoked") {
        throw new AuraAuthError({ code: "SESSION_REVOKED", headers: outHeaders })
    }
    if (new Date() >= session.expiresAt || session.status === "expired") {
        await context.ctx.session.config.adapter.revokeSession(session.id, "user_logout")
        throw new AuraAuthError({ code: "SESSION_EXPIRED", headers: outHeaders })
    }
    if (session.status !== "active") {
        throw new AuraAuthError({ code: "SESSION_INACTIVE", headers: outHeaders })
    }
    if (!session.user) {
        throw new AuraAuthError({ code: "USER_NOT_FOUND", headers: outHeaders })
    }
    return { session, sessionToken }
}
