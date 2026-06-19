import { createLocalJWKSet, type JWTVerifyGetKey } from "@aura-stack/jose/jose"
import { AuraAuthError } from "@/shared/errors.ts"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { assertContentTypeResponse } from "@/shared/assert.ts"
import { JWKSResponseSchema } from "@/schemas.ts"

interface CachedVerifier {
    verifier: JWTVerifyGetKey
    fetchedAt: number
}

const jwksVerifierCache = new Map<string, CachedVerifier>()
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000

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
    const cached = jwksVerifierCache.get(jwks_uri)
    const expired = !cached || Date.now() - cached.fetchedAt > JWKS_CACHE_TTL_MS
    if (expired) {
        const keys = await fetchJWKS(jwks_uri)
        jwksVerifierCache.set(jwks_uri, {
            verifier: createLocalJWKSet({ keys }),
            fetchedAt: Date.now(),
        })
    }
    return jwksVerifierCache.get(jwks_uri)!.verifier
}

export const ensureJWKSValidated = async (jwks_uri: string): Promise<JWTVerifyGetKey> => {
    return getJWKSVerifier(jwks_uri)
}

export const clearJWKSCache = (): void => {
    jwksVerifierCache.clear()
}
