import { createEndpoint } from "@aura-stack/router"
import { generateSecure } from "@/secure.js"
import { AuraResponse } from "@/response.js"
import { secureCookieOptions, setCookie } from "@/cookie.js"
import { integrations } from "@/oauth/index.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { createAuthorizationURL, createRedirectURI } from "@/actions/signIn/authorization.js"
import type { OAuthErrorResponse, AuthConfigInternal } from "@/@types/index.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations, cookies } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        try {
            if (!(oauth in oauthIntegrations)) {
                throw new AuthError("invalid_request", "Unsupported OAuth Social Integration")
            }
            const cookieOptions = secureCookieOptions(request, cookies)
            const state = generateSecure()
            const redirectURI = createRedirectURI(request.url, oauth)
            const stateCookie = setCookie("state", state, cookieOptions)
            const redirectURICookie = setCookie("redirect_uri", redirectURI, cookieOptions)
            const redirectToCookie = setCookie("redirect_to", request.headers.get("Referer") ?? "/", cookieOptions)

            const authorization = createAuthorizationURL(oauthIntegrations[oauth], redirectURI, state)
            const headers = new Headers()
            headers.set("Location", authorization)
            headers.append("Set-Cookie", stateCookie)
            headers.append("Set-Cookie", redirectURICookie)
            headers.append("Set-Cookie", redirectToCookie)

            return Response.json(
                { oauth },
                {
                    status: 302,
                    headers,
                }
            )
        } catch (error) {
            if (isAuthError(error)) {
                const { type, message } = error
                return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                    { error: type, error_description: message },
                    { status: 400 }
                )
            }
            return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                { error: ERROR_RESPONSE.AUTHORIZATION.SERVER_ERROR, error_description: "An unexpected error occurred" },
                { status: 500 }
            )
        }
    })
}
