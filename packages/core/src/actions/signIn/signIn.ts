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
                context: { oauth: providers, cookies, trustedProxyHeaders, basePath, logger },
            } = ctx
            const state = generateSecure()
            const redirectURI = createRedirectURI(request, oauth, basePath, trustedProxyHeaders)
            const redirectToValue = createRedirectTo(request, redirectTo, trustedProxyHeaders, logger)

            const { codeVerifier, codeChallenge, method } = await createPKCE()
            const authorization = createAuthorizationURL(providers[oauth], redirectURI, state, codeChallenge, method, logger)

            logger?.log({
                facility: 4,
                severity: "debug",
                msgId: "SIGN_IN_INITIATED",
                message: "Sign-in initiated",
                structuredData: {
                    oauth,
                    redirectURI,
                    state,
                    codeChallenge,
                    codeChallengeMethod: method,
                    redirectTo: redirectToValue,
                    authorizationURL: authorization,
                }
            })
            const { profile, ...exclude } = providers[oauth]
            logger?.log({
                facility: 4,
                severity: "debug",
                msgId: "OAUTH_PROVIDER_CONFIGURED",
                message: `OAuth provider ${oauth} configured for sign-in.`,
                structuredData: exclude
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
