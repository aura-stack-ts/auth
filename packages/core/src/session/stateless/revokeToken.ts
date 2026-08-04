import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/shared/errors.ts"
import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getCookie, getExpiredCookie } from "@/cookie.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const revokeToken = ({ ctx, cookies }: InternalStatelessContext) => {
    const { logger, identity, jwtManager: jwt, oauth } = ctx

    return async (oauthId: string, headers: Headers, disconnect: boolean): Promise<Headers> => {
        const cookieName = `${cookies().accessToken.name}.${oauthId}`
        const cookie = getCookie(headers, cookieName)
        const provider = oauth[oauthId]

        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        if (!disconnect) {
            const decodedToken = await jwt.verifyToken(cookie)
            const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

            logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauthId, hasAccessToken: !!tokens.accessToken },
            })

            await revokeProviderToken(provider, tokens.accessToken)

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: { provider: oauthId },
            })
        }
        const builder = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookieName, "", getExpiredCookie(cookies().accessToken.attributes))
            .toHeaders()
        return toUnionHeaders(builder, headers)
    }
}
