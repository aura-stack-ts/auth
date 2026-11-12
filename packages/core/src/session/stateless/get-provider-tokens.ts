import { HeadersBuilder } from "@aura-stack/router"
import { shouldRefresh } from "@/shared/utils.ts"
import { getCookie } from "@/shared/http/cookie.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const getProviderTokens = (ctx: InternalContextForStateless): SessionStrategy["getProviderTokens"] => {
    const { logger, identity, jose } = ctx

    return async ({ oauthId, provider, headers }) => {
        logger?.log("STATELESS_GET_PROVIDER_TOKENS_START", {
            structuredData: {
                strategy: "stateless",
                operation: "getProviderTokens",
                oauth_id: oauthId,
            },
        })

        const cookieName = `${ctx.cookies.store.accessToken.name}.${oauthId}`
        const cookie = getCookie(headers, cookieName)

        const decodedToken = await jose.manager.verifyToken(cookie)
        const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

        logger?.log("STATELESS_GET_PROVIDER_TOKENS_TOKENS_DECODED", {
            structuredData: {
                oauth_id: oauthId,
                has_access_token: Boolean(tokens.accessToken),
                has_refresh_token: Boolean(tokens.refreshToken),
                expires_at: tokens.expiresAt,
            },
        })

        const refreshWindow = provider.refreshWindow ?? 300
        const needsRefresh = shouldRefresh(tokens, refreshWindow)

        logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESH_CHECK", {
            structuredData: {
                oauth_id: oauthId,
                needs_refresh: needsRefresh,
                refresh_window: refreshWindow,
                expires_at: tokens.expiresAt,
            },
        })

        if (needsRefresh) {
            logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESHING", {
                structuredData: {
                    oauth_id: oauthId,
                    reason: "token_expired_or_in_refresh_window",
                },
            })

            const refreshedTokens = await refreshProviderToken(tokens, provider!)

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESH_SUCCESS", {
                structuredData: {
                    oauth_id: oauthId,
                    new_expires_at: refreshedTokens.expiresAt,
                },
            })

            const encodedTokens = await jose.manager.createToken(refreshedTokens as any)
            const builder = new HeadersBuilder(headers)
                .setCookie(cookieName, encodedTokens, ctx.cookies.store.accessToken.attributes)
                .toHeaders()

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_COOKIE_UPDATED", {
                structuredData: {
                    oauth_id: oauthId,
                    cookie_name: cookieName,
                },
            })

            return {
                tokens: refreshedTokens,
                headers: builder,
            }
        }

        logger?.log("STATELESS_GET_PROVIDER_TOKENS_SUCCESS", {
            structuredData: {
                oauth_id: oauthId,
                tokens_returned: true,
            },
        })

        return {
            tokens,
            headers,
        }
    }
}
