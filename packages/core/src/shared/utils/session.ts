import { getCookie } from "@/shared/http/cookie.ts"
import { AuraAuthError, getErrorName } from "@/errors/aura-error.ts"
import type { InternalCookieStoreConfig, InternalLogger, JWTManager, SchemaRegistryContext } from "@/@types/internal.ts"

export const getStandardSession = async ({
    sessionToken,
    jwt,
    identity,
}: {
    sessionToken: string
    jwt: JWTManager
    identity: SchemaRegistryContext
}) => {
    const claims = await jwt.verifyToken(sessionToken)
    const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)
    const { exp, iat: _iat, mexp: _mexp, ...defaultPayload } = parsedClaims
    const userClaims = await identity.schemaRegistry.parse(defaultPayload)
    if (!userClaims.sub) return null
    return {
        user: userClaims,
        expires: new Date(exp * 1000).toISOString(),
    }
}

export const verifySessionToken = async ({
    headers,
    cookies,
    jwt,
    logger,
}: {
    headers: Headers
    jwt: JWTManager
    cookies: InternalCookieStoreConfig
    logger: InternalLogger | undefined
}) => {
    let session = null
    try {
        session = getCookie(headers, cookies.sessionToken.name)
    } catch (cause) {
        logger?.log("SESSION_NOT_FOUND")
        throw new AuraAuthError({ code: "SESSION_NOT_FOUND", cause })
    }
    if (!session) {
        logger?.log("SESSION_NOT_FOUND")
        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
    }
    try {
        await jwt.verifyToken(session)
    } catch (error) {
        logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
        throw new AuraAuthError({ code: "SESSION_INVALID", cause: error })
    }
}
