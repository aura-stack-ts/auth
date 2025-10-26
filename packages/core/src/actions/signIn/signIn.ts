import { createEndpoint } from "@aura-stack/router"
import { createRedirectURI, generateSecure } from "../../utils.js"
import { setCookie } from "../../cookie.js"
import { integrations } from "../../oauth/index.js"
import { createAuthorizationURL } from "../signIn/authorize.js"
import type { AuthConfigInternal } from "../../@types/index.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        if (!(oauth in oauthIntegrations)) {
            return Response.json({ message: "OAuth provider not supported" }, { status: 400 })
        }
        const state = generateSecure()
        const inferRedirectURL = createRedirectURI(request.url, oauth)
        const cookie = setCookie("state", state)

        const authorize = createAuthorizationURL(oauthIntegrations[oauth], inferRedirectURL, state)
        const headers = new Headers()
        headers.set("Location", authorize)
        headers.set("Set-Cookie", cookie)

        return Response.json(
            { oauth },
            {
                status: 302,
                headers,
            }
        )
    })
}
