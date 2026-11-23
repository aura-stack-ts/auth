import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { transformToTokenPayload } from "@/shared/utils.ts"
import { createCSRF, timingSafeEqual } from "@/exports/crypto.ts"
import { verifyOIDCConfig } from "@/shared/oidc/verify-oidc-config.ts"
import { getCookie, getExpiredCookie, getOptionalCookie } from "@/shared/http/cookie.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAccessToken, createRedirectTo, getUserInfo } from "@/shared/oauth2/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const oauthCallback = (ctx: InternalContextForStateless): SessionStrategy["oauthCallback"] => {
    const { jose, logger } = ctx

    return async ({ oauthId, provider, request, params: { code, state }, cookieStore }) => {
        const isOIDC = isOIDCProvider(provider)
        const cookieState = getCookie(request, cookieStore.state.name)
        const codeVerifier = getCookie(request, cookieStore.codeVerifier.name)
        const cookieNonce = isOIDC ? getOptionalCookie(request, cookieStore.nonce.name) : null
        const cookieRedirectTo = getCookie(request, cookieStore.redirectTo.name)
        const cookieRedirectURI = getCookie(request, cookieStore.redirectURI.name)

        const clearCookieHeaders = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookieStore.state.name, "", getExpiredCookie(cookieStore.state.attributes))
            .setCookie(cookieStore.redirectURI.name, "", getExpiredCookie(cookieStore.redirectURI.attributes))
            .setCookie(cookieStore.redirectTo.name, "", getExpiredCookie(cookieStore.redirectTo.attributes))
            .setCookie(cookieStore.codeVerifier.name, "", getExpiredCookie(cookieStore.codeVerifier.attributes))
            .setCookie(cookieStore.nonce.name, "", getExpiredCookie(cookieStore.nonce.attributes))

        if (!timingSafeEqual(cookieState, state)) {
            throw new AuraAuthError({ code: "AUTH_MISMATCHING_STATE", headers: clearCookieHeaders.toHeaders() })
        }

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(provider) : provider
        const accessToken = await createAccessToken(resolvedConfig, cookieRedirectURI, code, codeVerifier, logger)

        await verifyOIDCConfig({
            isOIDC,
            accessToken,
            config: resolvedConfig,
            nonce: cookieNonce,
        })

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
            .setCookie(cookieStore.sessionToken.name, session, cookieStore.sessionToken.attributes)
            .setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes)
            .setCookie(`${cookieStore.accessToken.name}.${oauthId}`, providerToken, cookieStore.accessToken.attributes)
            .toHeaders()

        return { headers }
    }
}
