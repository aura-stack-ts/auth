import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { AuraResponse } from "@/response.js"
import { createPKCE, generateSecure } from "@/secure.js"
import { ERROR_RESPONSE, isAuthError } from "@/errors.js"
import { cacheControl, HeadersBuilder } from "@/headers.js"
import { oauthCookie, secureCookieOptions } from "@/cookie.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { AuthorizationError, AuthRuntimeConfig } from "@/@types/index.js"

const signInConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[], "The OAuth provider is not supported or invalid."),
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
                const cookieOptions = secureCookieOptions(request, cookies, trustedProxyHeaders)
                const state = generateSecure()
                const redirect_uri = createRedirectURI(request, oauth, basePath, trustedProxyHeaders)
                const { codeVerifier, codeChallenge, method } = await createPKCE()

                const authorization = createAuthorizationURL(providers[oauth], redirect_uri, state, codeChallenge, method)
                const redirect_to = createRedirectTo(request, redirectTo, trustedProxyHeaders)
                const headers = new HeadersBuilder(cacheControl, oauthCookie(cookieOptions))
                    .setHeader("Location", authorization)
                    .setCookie("state", state)
                    .setCookie("redirect_uri", redirect_uri)
                    .setCookie("redirect_to", redirect_to)
                    .setCookie("code_verifier", codeVerifier)
                    .toHeaders()
                return Response.json(
                    { oauth },
                    {
                        status: 302,
                        headers: headers,
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
