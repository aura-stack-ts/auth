import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { equals } from "@/utils.js"
import { cacheControl } from "@/headers.js"
import { getUserInfo } from "./userinfo.js"
import { AuraResponse } from "@/response.js"
import { createAccessToken } from "./access-token.js"
import { SESSION_VERSION } from "../session/session.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { OAuthAuthorizationErrorResponse, OAuthAuthorizationResponse } from "@/schemas.js"
import { createSessionCookie, expiredCookieOptions, getCookie, secureCookieOptions, setCookie } from "@/cookie.js"
import type { JWTPayload } from "@/jose.js"
import type { AuthConfigInternal, OAuthErrorResponse } from "@/@types/index.js"

const config = createEndpointConfig("/callback/:oauth", {
    schemas: {
        searchParams: OAuthAuthorizationResponse,
    },
})

export const callbackAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations, cookies } = authConfig

    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (request, ctx) => {
            const oauth = ctx.params.oauth as keyof typeof oauthIntegrations
            try {
                if (!(oauth in oauthIntegrations)) {
                    throw new AuthError(ERROR_RESPONSE.ACCESS_TOKEN.INVALID_REQUEST, "Unsupported OAuth Social Integration")
                }
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

                const headers = new Headers(cacheControl)
                headers.set("Location", cookieRedirectTo ?? "/")
                const userInfo = await getUserInfo(oauthConfig, accessToken.access_token)

                const sessionCookie = await createSessionCookie(
                    {
                        ...userInfo,
                        integrations: [oauth],
                        version: SESSION_VERSION,
                    } as never as JWTPayload,
                    cookieOptions
                )

                headers.set("Set-Cookie", sessionCookie)
                headers.append("Set-Cookie", setCookie("state", "", { ...cookieOptions, ...expiredCookieOptions }))
                headers.append("Set-Cookie", setCookie("redirect_uri", "", { ...cookieOptions, ...expiredCookieOptions }))
                headers.append("Set-Cookie", setCookie("redirect_to", "", { ...cookieOptions, ...expiredCookieOptions }))
                headers.append("Set-Cookie", setCookie("code_verifier", "", { ...cookieOptions, ...expiredCookieOptions }))
                return Response.json({ oauth }, { status: 302, headers })
            } catch (error) {
                if (isAuthError(error)) {
                    const { type, message } = error
                    return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                        { error: type, error_description: message },
                        { status: 400 }
                    )
                }
                return AuraResponse.json<OAuthErrorResponse<"token">>(
                    { error: ERROR_RESPONSE.ACCESS_TOKEN.INVALID_CLIENT, error_description: "An unexpected error occurred" },
                    { status: 500 }
                )
            }
        },
        config
    )
}
