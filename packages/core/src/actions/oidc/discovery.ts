import { AuraAuthError } from "@/shared/errors.ts"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { assertContentTypeResponse } from "@/shared/assert.ts"
import { OpenIDMetadataSchema } from "@/schemas.ts"
import type { OpenIDMetadata } from "@/@types/oidc.ts"

export const DISCOVERY_SUFFIX = "/.well-known/openid-configuration"

export const normalizeIssuer = (issuer: string): string => issuer.replace(/\/$/, "")

export const discoveryMetadata = async (issuer: string): Promise<OpenIDMetadata> => {
    let response: Response
    try {
        const base = normalizeIssuer(issuer)
        response = await fetchAsync(`${base}${DISCOVERY_SUFFIX}`, {
            headers: { Accept: "application/json" },
        })
        assertContentTypeResponse(response)
    } catch (cause) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_NETWORK_FAILED", cause })
    }
    if (!response.ok) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_INVALID_RESPONSE" })
    }
    let json: unknown
    try {
        json = await response.json()
    } catch (cause) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_INVALID_FORMAT_RESPONSE", cause })
    }
    const parsed = OpenIDMetadataSchema.safeParse(json)
    if (!parsed.success) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_INVALID_SCHEMA", cause: parsed.error })
    }
    const metadata = parsed.data as OpenIDMetadata
    if (normalizeIssuer(metadata.issuer) !== normalizeIssuer(issuer)) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_ISSUER_MISMATCH" })
    }
    return metadata
}
