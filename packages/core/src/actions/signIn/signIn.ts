import { createEndpoint } from "@aura-stack/router"
import { generateSecure } from "@/secure.js"
import { AuraResponse } from "@/response.js"
import { setCookie, setCookiesByNames } from "@/cookie.js"
import { integrations } from "@/oauth/index.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { createAuthorizationURL, createRedirectURI } from "@/actions/signIn/authorization.js"
import type { OAuthErrorResponse, AuthConfigInternal } from "@/@types/index.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        try {
            if (!(oauth in oauthIntegrations)) {
                throw new AuthError("invalid_request", "Unsupported OAuth Social Integration")
            }
            const state = generateSecure()
            const redirectURI = createRedirectURI(request.url, oauth)
            const stateCookie = setCookie("state", state)
            const redirectURICookie = setCookie("redirect_uri", redirectURI)

            const authorization = createAuthorizationURL(oauthIntegrations[oauth], redirectURI, state)
            const headers = new Headers()
            headers.set("Location", authorization)
            headers.append("Set-Cookie", stateCookie)
            headers.append("Set-Cookie", redirectURICookie)

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
