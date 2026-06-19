import { createLocalJWKSet, type JWTVerifyGetKey } from "@aura-stack/jose/jose"
import { AuraAuthError } from "@/shared/errors.ts"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { assertContentTypeResponse } from "@/shared/assert.ts"
import { JWKSResponseSchema } from "@/schemas.ts"

const jwksVerifierCache = new Map<string, JWTVerifyGetKey>()

export const fetchJWKS = async (jwks_uri: string) => {
    let response: Response
    try {
        response = await fetchAsync(jwks_uri, {
            headers: { Accept: "application/json" },
        })
        assertContentTypeResponse(response)
    } catch (cause) {
        throw new AuraAuthError({ code: "OIDC_JWKS_INVALID_RESPONSE", cause })
    }
    if (!response.ok) {
        throw new AuraAuthError({ code: "OIDC_JWKS_INVALID_RESPONSE" })
    }
    let json: unknown
    try {
        json = await response.json()
    } catch (cause) {
        throw new AuraAuthError({ code: "OIDC_JWKS_INVALID_RESPONSE", cause })
    }
    const parsed = JWKSResponseSchema.safeParse(json)
    if (!parsed.success) {
        throw new AuraAuthError({ code: "OIDC_JWKS_INVALID_SCHEMA", cause: parsed.error })
    }
    return parsed.data.keys
}

export const getJWKSVerifier = async (jwks_uri: string): Promise<JWTVerifyGetKey> => {
    if (!jwksVerifierCache.has(jwks_uri)) {
        const keys = await fetchJWKS(jwks_uri)
        jwksVerifierCache.set(jwks_uri, createLocalJWKSet({ keys }))
    }
    return jwksVerifierCache.get(jwks_uri)!
}

export const ensureJWKSValidated = async (jwks_uri: string): Promise<JWTVerifyGetKey> => {
    return getJWKSVerifier(jwks_uri)
}

export const clearJWKSCache = (): void => {
    jwksVerifierCache.clear()
}
