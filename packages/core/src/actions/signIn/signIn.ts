import z from "zod"
import { createEndpoint, createEndpointConfig, HeadersBuilder } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { createPKCE, generateSecure } from "@/secure.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { AuthRuntimeConfig } from "@/@types/index.js"

const signInConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[], "The OAuth provider is not supported or invalid."),
            }),
            searchParams: z.object({
                redirectTo: z.string().optional(),
            })
        },
    })
}

export const signInAction = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpoint(
        "GET",
        "/signIn/:oauth",
        async (ctx) => {
            const {
                request,
                params: { oauth },
                searchParams: { redirectTo },
                context: { oauth: providers, cookies, trustedProxyHeaders, basePath },
            } = ctx
            const state = generateSecure()
            const redirectURI = createRedirectURI(request, oauth, basePath, trustedProxyHeaders)
            const redirectToValue = createRedirectTo(request, redirectTo, trustedProxyHeaders)

            const { codeVerifier, codeChallenge, method } = await createPKCE()
            const authorization = createAuthorizationURL(providers[oauth], redirectURI, state, codeChallenge, method)

            const headers = new HeadersBuilder(cacheControl)
                .setHeader("Location", authorization)
                .setCookie(cookies.state.name, state, cookies.state.attributes)
                .setCookie(cookies.redirectURI.name, redirectURI, cookies.redirectURI.attributes)
                .setCookie(cookies.redirectTo.name, redirectToValue, cookies.redirectTo.attributes)
                .setCookie(cookies.codeVerifier.name, codeVerifier, cookies.codeVerifier.attributes)
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
