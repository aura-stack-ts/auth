import { z } from "zod"
import { createEndpoint, createEndpointConfig, HeadersBuilder } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { createPKCE, generateSecure } from "@/secure.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { OAuthProviderRecord } from "@/@types/index.js"

const signInConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
            searchParams: z.object({
                redirectTo: z.string().optional(),
            }),
        },
    })
}

export const signInAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/signIn/:oauth",
        async (ctx) => {
            const {
                request,
                params: { oauth },
                searchParams: { redirectTo },
                context,
            } = ctx
            const { oauth: providers, cookies, logger } = context
            const state = generateSecure()
            const redirectURI = await createRedirectURI(request, oauth, context)
            const redirectToValue = await createRedirectTo(request, redirectTo, context)

            const { codeVerifier, codeChallenge, method } = await createPKCE()
            const authorization = createAuthorizationURL(providers[oauth], redirectURI, state, codeChallenge, method, logger)

            logger?.log("SIGN_IN_INITIATED", {
                structuredData: { oauth_provider: oauth, code_challenge_method: method },
            })

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
