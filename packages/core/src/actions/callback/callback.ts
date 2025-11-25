import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { equals, isValidRelativePath, sanitizeURL } from "@/utils.js"
import { cacheControl } from "@/headers.js"
import { getUserInfo } from "./userinfo.js"
import { AuraResponse } from "@/response.js"
import { createAccessToken } from "./access-token.js"
import { SESSION_VERSION } from "../session/session.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { OAuthAuthorizationErrorResponse, OAuthAuthorizationResponse } from "@/schemas.js"
import { createSessionCookie, expireCookie, getCookie, secureCookieOptions, setCookie } from "@/cookie.js"
import type { JWTPayload } from "@/jose.js"
import type { AuthConfigInternal, OAuthErrorResponse } from "@/@types/index.js"

const callbackConfig = (oauth: AuthConfigInternal["oauth"]) => {
    return createEndpointConfig("/callback/:oauth", {
        schemas: {
            searchParams: OAuthAuthorizationResponse,
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[]),
            }),
        },
    })
}
export const callbackAction = ({ oauth: oauthIntegrations, cookies }: AuthConfigInternal) => {
    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (request, ctx) => {
            const oauth = ctx.params.oauth
            try {
                const isErrorResponse = OAuthAuthorizationErrorResponse.safeParse(ctx.searchParams)
                if (isErrorResponse.success) {
                    const { error, error_description } = isErrorResponse.data
                    throw new AuthError(error, error_description ?? "OAuth Authorization Error")
                }

                const oauthConfig = oauthIntegrations[oauth]
                const { code, state } = ctx.searchParams

                const cookieOptions = secureCookieOptions(request, cookies)
                const cookieState = getCookie(request, "state", cookieOptions)
                const cookieRedirectTo = getCookie(request, "redirect_to", cookieOptions)
                const cookieRedirectURI = getCookie(request, "redirect_uri", cookieOptions)
                const codeVerifier = getCookie(request, "code_verifier", cookieOptions)

                if (!equals(cookieState, state)) {
                    throw new AuthError(ERROR_RESPONSE.ACCESS_TOKEN.INVALID_REQUEST, "Mismatching state")
                }

                const accessToken = await createAccessToken(oauthConfig, cookieRedirectURI, code, codeVerifier)
                const sanitized = sanitizeURL(cookieRedirectTo)
                if (!isValidRelativePath(sanitized)) {
                    throw new AuthError(
                        ERROR_RESPONSE.ACCESS_TOKEN.INVALID_REQUEST,
                        "Invalid redirect path. Potential open redirect attack detected."
                    )
                }

                const headers = new Headers(cacheControl)
                headers.set("Location", sanitized)
                const userInfo = await getUserInfo(oauthConfig, accessToken.access_token)

                const sessionCookie = await createSessionCookie(
                    {
                        ...userInfo,
                        integrations: [oauth],
                        version: SESSION_VERSION,
                    } as never as JWTPayload,
                    cookieOptions
                )

                const csrfToken = await createCSRF()
                const csrfCookie = setCookie(
                    "csrfToken",
                    csrfToken,
                    secureCookieOptions(request, {
                        ...cookies,
                        flag: "host",
                    })
                )
                headers.set("Set-Cookie", sessionCookie)
                headers.append("Set-Cookie", expireCookie("state", cookieOptions))
                headers.append("Set-Cookie", expireCookie("redirect_uri", cookieOptions))
                headers.append("Set-Cookie", expireCookie("redirect_to", cookieOptions))
                headers.append("Set-Cookie", expireCookie("code_verifier", cookieOptions))
                headers.append("Set-Cookie", csrfCookie)
                return Response.json({ oauth }, { status: 302, headers })
            } catch (error) {
                if (isAuthError(error)) {
                    const { type, message } = error
                    return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                        { error: type, error_description: message },
                        { status: statusCode.BAD_REQUEST }
                    )
                }
                return AuraResponse.json<OAuthErrorResponse<"token">>(
                    { error: ERROR_RESPONSE.ACCESS_TOKEN.INVALID_CLIENT, error_description: "An unexpected error occurred" },
                    { status: statusCode.INTERNAL_SERVER_ERROR }
                )
            }
        },
        callbackConfig(oauthIntegrations)
    )
}
