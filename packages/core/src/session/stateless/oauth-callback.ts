import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { cacheControl } from "@/shared/http/headers.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { transformToTokenPayload } from "@/shared/utils.ts"
import { createCSRF, timingSafeEqual } from "@/exports/crypto.ts"
import { getCookie, getExpiredCookie, getOptionalCookie } from "@/shared/http/cookie.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAccessToken, createRedirectTo, getUserInfo } from "@/shared/oauth2/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const oauthCallback = (ctx: InternalContextForStateless): SessionStrategy["oauthCallback"] => {
    const { cookies, jose, logger } = ctx

    return async ({ oauthId, provider, request, params: { code, state } }) => {
        const isOIDC = isOIDCProvider(provider)
        const cookieState = getCookie(request, cookies.store.state.name)
        const codeVerifier = getCookie(request, cookies.store.codeVerifier.name)
        const cookieNonce = isOIDC ? getOptionalCookie(request, cookies.store.nonce.name) : undefined
        const cookieRedirectTo = getCookie(request, cookies.store.redirectTo.name)
        const cookieRedirectURI = getCookie(request, cookies.store.redirectURI.name)

        const clearCookieHeaders = new HeadersBuilder(cacheControl)
            .setCookie(cookies.store.state.name, "", getExpiredCookie(cookies.store.state.attributes))
            .setCookie(cookies.store.redirectURI.name, "", getExpiredCookie(cookies.store.redirectURI.attributes))
            .setCookie(cookies.store.redirectTo.name, "", getExpiredCookie(cookies.store.redirectTo.attributes))
            .setCookie(cookies.store.codeVerifier.name, "", getExpiredCookie(cookies.store.codeVerifier.attributes))
            .setCookie(cookies.store.nonce.name, "", getExpiredCookie(cookies.store.nonce.attributes))

        if (!timingSafeEqual(cookieState, state)) {
            throw new AuraAuthError({ code: "AUTH_MISMATCHING_STATE", headers: clearCookieHeaders.toHeaders() })
        }

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(provider) : provider
        const accessToken = await createAccessToken(resolvedConfig, cookieRedirectURI, code, codeVerifier, logger)

        if (isOIDC) {
            if (!accessToken.id_token) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            const { issuer, jwks_uri } = resolvedConfig.oidc!
            if (!jwks_uri || !cookieNonce || !resolvedConfig.clientId) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            await validateIDToken(accessToken.id_token, {
                issuer,
                clientId: resolvedConfig.clientId,
                nonce: cookieNonce,
                jwks_uri,
            })
        }

        const redirectTo = await createRedirectTo(request, cookieRedirectTo, ctx)

        const userInfo = await getUserInfo(resolvedConfig, accessToken, logger)
        const session = await ctx.session.strategy.createSession({ session: userInfo, request })
        const csrfToken = await createCSRF(jose.instance)
        const tokenPayload = transformToTokenPayload(accessToken)
        const providerToken = await jose.manager.createToken(tokenPayload)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
            },
        })

        const headers = clearCookieHeaders
            .setHeader("Location", redirectTo)
            .setCookie(cookies.store.sessionToken.name, session, cookies.store.sessionToken.attributes)
            .setCookie(cookies.store.csrfToken.name, csrfToken, cookies.store.csrfToken.attributes)
            .setCookie(`${cookies.store.accessToken.name}.${oauthId}`, providerToken, cookies.store.accessToken.attributes)
            .toHeaders()

        return { headers }
    }
}
