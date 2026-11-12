import { HeadersBuilder } from "@aura-stack/router"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import { getCookie, getExpiredCookie } from "@/shared/http/cookie.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const revokeToken = (ctx: InternalContextForStateless): SessionStrategy["revokeToken"] => {
    const { logger, identity, jose } = ctx

    return async ({ oauthId, provider, disconnect, headers }) => {
        const cookieName = `${ctx.cookies.store.accessToken.name}.${oauthId}`
        const cookie = getCookie(headers, cookieName)

        if (!disconnect) {
            const decodedToken = await jose.manager.verifyToken(cookie)
            const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

            logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauthId, hasAccessToken: !!tokens.accessToken },
            })

            await revokeProviderToken(provider, tokens.accessToken)

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: { provider: oauthId },
            })
        }
        const builder = new HeadersBuilder(headers)
            .setCookie(cookieName, "", getExpiredCookie(ctx.cookies.store.accessToken.attributes))
            .toHeaders()
        return { headers: builder }
    }
}
