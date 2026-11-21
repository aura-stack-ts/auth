import { AuraAuthError } from "@/errors/aura-error.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import type { OAuthAccessTokenResponseType, RuntimeOAuthProvider } from "@/@types/internal.ts"

export const verifyOIDCConfig = async ({
    isOIDC,
    config,
    accessToken,
    nonce,
}: {
    isOIDC: boolean
    accessToken: OAuthAccessTokenResponseType & { id_token?: string }
    config: RuntimeOAuthProvider
    nonce: string | null | undefined
}) => {
    if (!isOIDC) return
    if (!accessToken.id_token) {
        throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
    }
    const { issuer, jwks_uri } = config.oidc!
    if (!jwks_uri || !nonce || !config.clientId) {
        throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
    }
    await validateIDToken(accessToken.id_token as string, {
        issuer,
        clientId: config.clientId,
        nonce: nonce,
        jwks_uri,
    })
}
