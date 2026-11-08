import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { cacheControl } from "@/shared/http/headers.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { transformToTokenPayload } from "@/shared/utils.ts"
import { createCSRF, timingSafeEqual } from "@/shared/crypto.ts"
import { getTrustedOrigins } from "@/config/get-trusted-origins.ts"
import { createAccessToken, getUserInfo } from "@/shared/oauth2/index.ts"
import { getCookie, getExpiredCookie, getOptionalCookie } from "@/shared/http/cookie.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { getOriginURL, isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/utils/get-origin-url.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const oauthCallback = (ctx: InternalContextForStateless): SessionStrategy["oauthCallback"] => {
    return async ({ oauthId, request, params: { code, state } }) => {
        const { oauth: providers, cookies, jose, logger, trustedOrigins } = ctx

        const oauthConfig = providers[oauthId]
        if (!oauthConfig) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        const isOIDC = isOIDCProvider(oauthConfig)
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
            logger?.log("MISMATCHING_STATE", {
                structuredData: {
                    oauth_provider: oauthId,
                },
            })
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_MISMATCHING_STATE",
                    message: "The provided state passed in the OAuth response does not match the stored token state.",
                },
                { headers: clearCookieHeaders.toHeaders(), status: 400 }
            )
        }

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(oauthConfig) : oauthConfig
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

        if (!isRelativeURL(cookieRedirectTo)) {
            const origins = await getTrustedOrigins(request, trustedOrigins)
            const requestOrigin = await getOriginURL(request, ctx)
            let isValid = false
            try {
                isValid =
                    origins.length > 0
                        ? isTrustedOrigin(cookieRedirectTo, origins)
                        : isSameOrigin(cookieRedirectTo, requestOrigin)
            } catch {
                isValid = false
            }
            if (!isValid) {
                logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED", {
                    structuredData: {
                        redirect_path: cookieRedirectTo,
                        provider: oauthId,
                        has_trusted_origins: origins.length > 0,
                        request_origin: requestOrigin,
                    },
                })
                throw new AuraAuthError({ code: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED" })
            }
        }

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
            .setHeader("Location", cookieRedirectTo)
            .setCookie(cookies.store.sessionToken.name, session, cookies.store.sessionToken.attributes)
            .setCookie(cookies.store.csrfToken.name, csrfToken, cookies.store.csrfToken.attributes)
            .setCookie(`${cookies.store.accessToken.name}.${oauthId}`, providerToken, cookies.store.accessToken.attributes)
            .toHeaders()

        return Response.json({ oauth: oauthId }, { status: 302, headers: headers })
    }
}
