import { HeadersBuilder } from "@aura-stack/router"
import { toUnionHeaders } from "@/shared/http/headers.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { getCookie, getExpiredCookie } from "@/shared/http/cookie.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const revokeToken = ({ ctx, cookies }: InternalStatelessContext): SessionStrategy["revokeToken"] => {
    const { logger, identity, jwtManager: jwt } = ctx

    return async ({ oauthId, provider, disconnect, headers }) => {
        const cookieName = `${cookies().accessToken.name}.${oauthId}`
        const cookie = getCookie(headers, cookieName)

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
