import { errors } from "@aura-stack/jose/jose"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { getOptionalCookie } from "@/shared/http/cookie.ts"
import type { InternalCookieStoreConfig, JoseManager } from "@/@types/internal.ts"

export const verifySessionToken = async ({
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
    if (!token) throw new AuraAuthError({ code: "SESSION_MISSING", headers: outHeaders })
    try {
        const session = await jwt.verifyToken(token)
        return { session, sessionToken: token }
    } catch (error) {
        if (error instanceof errors.JWTExpired) {
            throw new AuraAuthError({ code: "SESSION_EXPIRED", headers: outHeaders })
        }
        throw new AuraAuthError({ code: "SESSION_INVALID", cause: error, headers: outHeaders })
    }
}
