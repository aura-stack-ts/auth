import { createEndpoint } from "@aura-stack/router"
import { generateSecure } from "@/utils.js"
import { setCookiesByNames } from "@/cookie.js"
import { integrations } from "@/oauth/index.js"
import { createAuthorizationURL, createRedirectURI } from "@/actions/signIn/authorization.js"
import { ErrorResponse, type AuthConfigInternal } from "@/@types/index.js"
import { AuraResponse } from "@/response.js"
import { AuraAuthError, isAuraAuthError } from "@/error.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        try {
            if (!(oauth in oauthIntegrations)) {
                throw new AuraAuthError("invalid_request", "Unsupported OAuth Social Integration")
            }
            const state = generateSecure()
            const redirectURI = createRedirectURI(request.url, oauth)
            const cookies = setCookiesByNames({
                state,
                redirect_uri: redirectURI,
                original_uri: request.url,
            })

            const authorization = createAuthorizationURL(oauthIntegrations[oauth], redirectURI, state)
            const headers = new Headers()
            headers.set("Location", authorization)
            headers.set("Set-Cookie", cookies)

            return Response.json(
                { oauth },
                {
                    status: 302,
                    headers,
                }
            )
        } catch (error) {
            if (isAuraAuthError(error)) {
                const { type, message } = error
                return AuraResponse.json<ErrorResponse>({ error: type, error_description: message }, { status: 400 })
            }
            return AuraResponse.json<ErrorResponse>(
                { error: "server_error", error_description: "An unexpected error occurred" },
                { status: 500 }
            )
        }
    })
}
