import z from "zod"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { createPKCE, generateSecure } from "@/secure.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { AuthRuntimeConfig } from "@/@types/index.js"

const signInConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[], "The OAuth provider is not supported or invalid."),
                redirectTo: z.string().optional(),
            }),
        },
        middlewares: [
            (ctx) => {
                return ctx
            },
        ],
    })
}

export const signInAction = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpoint(
        "GET",
        "/signIn/:oauth",
        async (ctx) => {
            const {
                request,
                headers: headersBuilder,
                params: { oauth, redirectTo },
                context: { oauth: providers, cookies, trustedProxyHeaders, basePath },
            } = ctx
            const state = generateSecure()
            const redirectURI = createRedirectURI(request, oauth, basePath, trustedProxyHeaders)
            const redirectToValue = createRedirectTo(request, redirectTo, trustedProxyHeaders)

            const { codeVerifier, codeChallenge, method } = await createPKCE()
            const authorization = createAuthorizationURL(providers[oauth], redirectURI, state, codeChallenge, method)

            const headers = headersBuilder
                .setHeader("Location", authorization)
                .setCookie(cookies.state.name, state, cookies.state.attributes)
                .setCookie(cookies.redirect_uri.name, redirectURI, cookies.redirect_uri.attributes)
                .setCookie(cookies.redirect_to.name, redirectToValue, cookies.redirect_to.attributes)
                .setCookie(cookies.code_verifier.name, codeVerifier, cookies.code_verifier.attributes)
                .toHeaders()
            return Response.json(
                { oauth },
                {
                    status: 302,
                    headers,
                }
            )
        },
        signInConfig(oauth)
    )
}
