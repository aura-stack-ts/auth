import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig, HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/shared/crypto.ts"
import { cacheControl } from "@/shared/headers.ts"
import { timingSafeEqual } from "@/shared/utils.ts"
import { getCookie, getExpiredCookie } from "@/cookie.ts"
import { AuraAuthError } from "@/shared/unstable_error.ts"
import { getUserInfo } from "@/actions/callback/userinfo.ts"
import { OAuthAuthorizationErrorResponse } from "@/schemas.ts"
import { createAccessToken } from "@/actions/callback/access-token.ts"
import { isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/assert.ts"
import { getOriginURL, getTrustedOrigins } from "@/actions/signIn/authorization.ts"
import type { OAuthProviderRecord } from "@/@types/index.ts"

const callbackConfig = (oauth: OAuthProviderRecord) => {
    // @ts-ignore
    return createEndpointConfig("/callback/:oauth", {
        /**
         * @todo Add support to any schema (zod, arktype and valibot)
         */
        schemas: {
            // @ts-ignore
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
            // @ts-ignore
            searchParams: z.object({
                code: z.string("Missing code parameter in the OAuth authorization response."),
                state: z.string("Missing state parameter in the OAuth authorization response."),
            }),
        },
        use: [
            (ctx) => {
                const {
                    searchParams,
                    context: { logger },
                } = ctx
                const response = OAuthAuthorizationErrorResponse.safeParse(searchParams)
                if (response.success) {
                    const { error, error_description } = response.data
                    const criticalAuthErrors = ["access_denied", "server_error"]
                    const severity = criticalAuthErrors.includes(error.toLowerCase()) ? "critical" : "warning"
                    logger?.log("OAUTH_AUTHORIZATION_ERROR", {
                        severity,
                        structuredData: {
                            error,
                            error_description: error_description ?? "",
                        },
                    })
                    throw new AuraAuthError({ code: "AUTH_CALLBACK_MISSING_PARAMETERS" })
                }
                return ctx
            },
        ],
    })
}

export const callbackAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (ctx) => {
            const {
                request,
                params: { oauth },
                searchParams: { code, state },
                context,
            } = ctx
            const { oauth: providers, cookies, jose, logger, trustedOrigins } = context

            const oauthConfig = providers[oauth]
            const cookieState = getCookie(request, cookies.state.name)
            const codeVerifier = getCookie(request, cookies.codeVerifier.name)
            const cookieRedirectTo = getCookie(request, cookies.redirectTo.name)
            const cookieRedirectURI = getCookie(request, cookies.redirectURI.name)

            const clearCookieHeaders = new HeadersBuilder(cacheControl)
                .setCookie(cookies.state.name, "", getExpiredCookie(cookies.state.attributes))
                .setCookie(cookies.redirectURI.name, "", getExpiredCookie(cookies.redirectURI.attributes))
                .setCookie(cookies.redirectTo.name, "", getExpiredCookie(cookies.redirectTo.attributes))
                .setCookie(cookies.codeVerifier.name, "", getExpiredCookie(cookies.codeVerifier.attributes))

            if (!timingSafeEqual(cookieState, state)) {
                logger?.log("MISMATCHING_STATE", {
                    structuredData: {
                        oauth_provider: oauth,
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

            const accessToken = await createAccessToken(oauthConfig, cookieRedirectURI, code, codeVerifier, logger)
            const origins = await getTrustedOrigins(request, trustedOrigins)
            const requestOrigin = await getOriginURL(request, context)

            if (!isRelativeURL(cookieRedirectTo)) {
                const isValid =
                    origins.length > 0
                        ? isTrustedOrigin(cookieRedirectTo, origins)
                        : isSameOrigin(cookieRedirectTo, requestOrigin)
                if (!isValid) {
                    logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED", {
                        structuredData: {
                            redirect_path: cookieRedirectTo,
                            provider: oauth,
                            has_trusted_origins: origins.length > 0,
                            request_origin: requestOrigin,
                        },
                    })
                    throw new AuraAuthError({ code: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED" })
                }
            }

            const userInfo = await getUserInfo(oauthConfig, accessToken, logger)
            const session = await context.sessionStrategy.createSession(userInfo)
            const csrfToken = await createCSRF(jose)

            logger?.log("OAUTH_CALLBACK_SUCCESS", {
                structuredData: {
                    provider: oauth,
                },
            })

            const headers = clearCookieHeaders
                .setHeader("Location", cookieRedirectTo)
                .setCookie(cookies.sessionToken.name, session, cookies.sessionToken.attributes)
                .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
                .toHeaders()
            return Response.json({ oauth }, { status: 302, headers: headers })
        },
        callbackConfig(oauth)
    )
}
