import { z } from "zod"
import { createEndpoint, createEndpointConfig, HeadersBuilder } from "@aura-stack/router"
import { equals } from "@/utils.js"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { isRelativeURL } from "@/assert.js"
import { getUserInfo } from "@/actions/callback/userinfo.js"
import { OAuthAuthorizationErrorResponse } from "@/schemas.js"
import { AuthSecurityError, OAuthProtocolError } from "@/errors.js"
import { createAccessToken } from "@/actions/callback/access-token.js"
import { createSessionCookie, getCookie, expiredCookieAttributes } from "@/cookie.js"
import type { JWTPayload } from "@/jose.js"
import type { OAuthProviderRecord } from "@/@types/index.js"

const callbackConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig("/callback/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
            searchParams: z.object({
                code: z.string("Missing code parameter in the OAuth authorization response."),
                state: z.string("Missing state parameter in the OAuth authorization response."),
            }),
        },
        middlewares: [
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
                    throw new OAuthProtocolError(error, error_description || "OAuth Authorization Error")
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
                context: { oauth: providers, cookies, jose, logger },
            } = ctx

            const oauthConfig = providers[oauth]
            const cookieState = getCookie(request, cookies.state.name)
            const cookieRedirectTo = getCookie(request, cookies.redirectTo.name)
            const cookieRedirectURI = getCookie(request, cookies.redirectURI.name)
            const codeVerifier = getCookie(request, cookies.codeVerifier.name)

            if (!equals(cookieState, state)) {
                logger?.log("MISMATCHING_STATE", {
                    structuredData: {
                        oauth_provider: oauth,
                    },
                })
                throw new AuthSecurityError(
                    "MISMATCHING_STATE",
                    "The provided state passed in the OAuth response does not match the stored state."
                )
            }

            const accessToken = await createAccessToken(oauthConfig, cookieRedirectURI, code, codeVerifier, logger)
            if (!isRelativeURL(cookieRedirectTo)) {
                logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED", {
                    structuredData: {
                        redirect_path: cookieRedirectTo,
                        provider: oauth,
                    },
                })
                throw new AuthSecurityError(
                    "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED",
                    "Invalid redirect path. Potential open redirect attack detected."
                )
            }

            const userInfo = await getUserInfo(oauthConfig, accessToken.access_token, logger)
            const sessionCookie = await createSessionCookie(jose, userInfo as JWTPayload)
            const csrfToken = await createCSRF(jose)

            logger?.log("OAUTH_CALLBACK_SUCCESS", {
                structuredData: {
                    provider: oauth,
                },
            })

            const headers = new HeadersBuilder(cacheControl)
                .setHeader("Location", cookieRedirectTo)
                .setCookie(cookies.sessionToken.name, sessionCookie, cookies.sessionToken.attributes)
                .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
                .setCookie(cookies.state.name, "", expiredCookieAttributes)
                .setCookie(cookies.redirectURI.name, "", expiredCookieAttributes)
                .setCookie(cookies.redirectTo.name, "", expiredCookieAttributes)
                .setCookie(cookies.codeVerifier.name, "", expiredCookieAttributes)
                .toHeaders()
            return Response.json({ oauth }, { status: 302, headers: headers })
        },
        callbackConfig(oauth)
    )
}
