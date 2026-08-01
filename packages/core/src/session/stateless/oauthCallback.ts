import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { cacheControl } from "@/shared/headers.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { createAccessToken, getUserInfo } from "@/shared/utils/oauth.ts"
import { timingSafeEqual, transformToTokenPayload } from "@/shared/utils.ts"
import { getCookie, getExpiredCookie, getOptionalCookie } from "@/cookie.ts"
import { getOriginURL, getTrustedOrigins } from "@/shared/utils/authorization.ts"
import { isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/assert.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import type { InternalStatelessContext } from "@/@types/session.ts"

export const __oauthCallback = ({ ctx }: InternalStatelessContext) => {
    return async (oauthId: string, request: Request, { code, state }: { code: string; state: string }) => {
        const { oauth: providers, cookies, jose, logger, trustedOrigins } = ctx

        const oauthConfig = providers[oauthId]
        if (!oauthConfig) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        const isOIDC = isOIDCProvider(oauthConfig)
        const cookieState = getCookie(request, cookies.state.name)
        const codeVerifier = getCookie(request, cookies.codeVerifier.name)
        const cookieNonce = isOIDC ? getOptionalCookie(request, cookies.nonce.name) : undefined
        const cookieRedirectTo = getCookie(request, cookies.redirectTo.name)
        const cookieRedirectURI = getCookie(request, cookies.redirectURI.name)

        const clearCookieHeaders = new HeadersBuilder(cacheControl)
            .setCookie(cookies.state.name, "", getExpiredCookie(cookies.state.attributes))
            .setCookie(cookies.redirectURI.name, "", getExpiredCookie(cookies.redirectURI.attributes))
            .setCookie(cookies.redirectTo.name, "", getExpiredCookie(cookies.redirectTo.attributes))
            .setCookie(cookies.codeVerifier.name, "", getExpiredCookie(cookies.codeVerifier.attributes))
            .setCookie(cookies.nonce.name, "", getExpiredCookie(cookies.nonce.attributes))

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
        const session = await ctx.sessionStrategy.createSession(userInfo, request)
        const csrfToken = await createCSRF(jose)
        const tokenPayload = transformToTokenPayload(accessToken)
        const providerToken = await ctx.jwtManager.createToken(tokenPayload)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
            },
        })

        const headers = clearCookieHeaders
            .setHeader("Location", cookieRedirectTo)
            .setCookie(cookies.sessionToken.name, session, cookies.sessionToken.attributes)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(`${cookies.accessToken.name}.${oauthId}`, providerToken, cookies.accessToken.attributes)
            .toHeaders()

        return Response.json({ oauth: oauthId }, { status: 302, headers: headers })
    }
}
