import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { setCookie } from "@/cookie.js"
import { AuraResponse } from "@/response.js"
import { createPKCE, generateSecure } from "@/secure.js"
import { ERROR_RESPONSE, isAuthError } from "@/error.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { AuthorizationError, AuthRuntimeConfig } from "@/@types/index.js"

const signInConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[]),
                redirectTo: z.string().optional(),
            }),
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
                params: { oauth, redirectTo },
                context: { oauth: providers, cookies, trustedProxyHeaders, basePath },
            } = ctx
            try {
                const state = generateSecure()
                const redirectURI = createRedirectURI(request, oauth, basePath, trustedProxyHeaders)
                const stateCookie = setCookie(cookies.state.name, state, cookies.state.attributes)

                const redirectURICookie = setCookie(cookies.redirect_uri.name, redirectURI, cookies.redirect_uri.attributes)
                const redirectToCookie = setCookie(
                    cookies.redirect_to.name,
                    createRedirectTo(request, redirectTo, trustedProxyHeaders),
                    cookies.redirect_to.attributes
                )

                const { codeVerifier, codeChallenge, method } = await createPKCE()
                const codeVerifierCookie = setCookie(cookies.code_verifier.name, codeVerifier, cookies.code_verifier.attributes)

                const authorization = createAuthorizationURL(providers[oauth], redirectURI, state, codeChallenge, method)
                const headers = new Headers()
                headers.set("Location", authorization)
                headers.append("Set-Cookie", stateCookie)
                headers.append("Set-Cookie", redirectURICookie)
                headers.append("Set-Cookie", redirectToCookie)
                headers.append("Set-Cookie", codeVerifierCookie)

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
                    return AuraResponse.json<AuthorizationError>(
                        { error: type as AuthorizationError["error"], error_description: message },
                        { status: statusCode.BAD_REQUEST }
                    )
                }
                return AuraResponse.json<AuthorizationError>(
                    {
                        error: ERROR_RESPONSE.AUTHORIZATION.SERVER_ERROR as AuthorizationError["error"],
                        error_description: "An unexpected error occurred",
                    },
                    { status: statusCode.INTERNAL_SERVER_ERROR }
                )
            }
        },
        signInConfig(oauth)
    )
}
