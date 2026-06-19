import { jwtVerify, errors as joseErrors } from "@aura-stack/jose/jose"
import { AuraAuthError } from "@/shared/errors.ts"
import { timingSafeEqual } from "@/shared/utils.ts"
import { IDTokenClaimsSchema } from "@/schemas.ts"
import { ensureJWKSValidated } from "@/actions/oidc/jwks.ts"
import { normalizeIssuer } from "@/actions/oidc/discovery.ts"

export interface ValidateIDTokenOptions {
    issuer: string
    clientId: string
    nonce: string
    jwks_uri: string
}

export const validateIDToken = async (idToken: string, options: ValidateIDTokenOptions): Promise<void> => {
    const { issuer, clientId, nonce, jwks_uri } = options
    try {
        const jwks = await ensureJWKSValidated(jwks_uri)
        const { payload } = await jwtVerify(idToken, jwks, {
            issuer: normalizeIssuer(issuer),
            audience: clientId,
        })

        const claims = IDTokenClaimsSchema.safeParse(payload)
        if (!claims.success) {
            throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID", cause: claims.error })
        }

        if (!claims.data.nonce || !timingSafeEqual(claims.data.nonce, nonce)) {
            throw new AuraAuthError({ code: "OIDC_NONCE_MISMATCH" })
        }
    } catch (error) {
        if (error instanceof AuraAuthError) {
            throw error
        }
        if (error instanceof joseErrors.JWTExpired) {
            throw new AuraAuthError({ code: "JWT_EXPIRED", cause: error })
        }
        if (error instanceof joseErrors.JWTInvalid || error instanceof joseErrors.JWSInvalid) {
            throw new AuraAuthError({ code: "JWT_MALFORMED", cause: error })
        }
        if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
            throw new AuraAuthError({ code: "JWT_INVALID_SIGNATURE", cause: error })
        }
        if (error instanceof joseErrors.JOSEAlgNotAllowed) {
            throw new AuraAuthError({ code: "JWT_ALGORITHM_MISMATCH", cause: error })
        }
        throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID", cause: error })
    }
}
