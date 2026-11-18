import { AuraAuthError } from "@/errors/aura-error.ts"
import { getOptionalCookie } from "@/shared/http/cookie.ts"
import type { InternalCookieStoreConfig, JoseManager } from "@/@types/internal.ts"

export const verifySessionToken = async ({
    headers,
    cookies,
    jwt,
}: {
    headers: Headers
    jwt: JoseManager
    cookies: InternalCookieStoreConfig
}) => {
    const token = getOptionalCookie(headers, cookies.sessionToken.name)
    if (!token) throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
    try {
        const session = await jwt.verifyToken(token)
        return { session, sessionToken: token }
    } catch (cause) {
        throw new AuraAuthError({ code: "SESSION_INVALID", cause })
    }
}
