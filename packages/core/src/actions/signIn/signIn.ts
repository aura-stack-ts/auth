import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig, HeadersBuilder } from "@aura-stack/router"
import { cacheControl } from "@/headers.ts"
import { createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.ts"
import { createAuthorizationURL } from "@/actions/signIn/authorization-url.ts"
import type { OAuthProviderRecord } from "@/@types/index.ts"

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
            const redirectURI = await createRedirectURI(request, oauth, context)
            const redirectToValue = await createRedirectTo(request, redirectTo, context)

            const { authorization, state, codeVerifier, method } = await createAuthorizationURL(providers[oauth], redirectURI, context)

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
