import { createEndpoint } from "@aura-stack/router"
import { createRedirectURI, generateSecure } from "@/utils.js"
import { setCookiesByNames } from "@/cookie.js"
import { integrations } from "@/oauth/index.js"
import { createAuthorizationURL } from "@/actions/signIn/authorize.js"
import type { AuthConfigInternal } from "@/@types/index.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        if (!(oauth in oauthIntegrations)) {
            return Response.json({ error: "OAuth provider not supported" }, { status: 400 })
        }
        const state = generateSecure()
        const redirectURI = createRedirectURI(request.url, oauth)
        const cookies = setCookiesByNames({
            state,
            redirect_uri: redirectURI,
            original_uri: request.url,
        })

        const authorize = createAuthorizationURL(oauthIntegrations[oauth], redirectURI, state)
        const headers = new Headers()
        headers.set("Location", authorize)
        headers.set("Set-Cookie", cookies)

        return Response.json(
            { oauth },
            {
                status: 302,
                headers,
            }
        )
    })
}
