import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { fetchAsync } from "@/shared/http/fetch-async.ts"
import { assertContentTypeResponse } from "@/shared/assert.ts"
import { OpenIDMetadataSchema } from "@/shared/schemas/general.ts"
import type { OpenIDMetadata } from "@/@types/oidc.ts"

export const DISCOVERY_SUFFIX = "/.well-known/openid-configuration"

export const normalizeIssuer = (issuer: string): string => issuer.replace(/\/$/, "")

export const discoveryMetadata = async (issuer: string): Promise<OpenIDMetadata> => {
    const base = normalizeIssuer(issuer)
    const response = await fetchAsync(`${base}${DISCOVERY_SUFFIX}`, {
        headers: { Accept: "application/json" },
    }).catch((error) => {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_NETWORK_FAILED", cause: error })
    })
    assertContentTypeResponse(response)
    if (!response.ok) {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_INVALID_RESPONSE" })
    }
    const json = await response.json().catch((error) => {
        throw new AuraAuthError({ code: "OIDC_DISCOVERY_INVALID_FORMAT_RESPONSE", cause: error })
    })
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
