import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { AuraResponse } from "@/response.js"
import { createPKCE, generateSecure } from "@/secure.js"
import { ERROR_RESPONSE, isAuthError } from "@/error.js"
import { oauthCookie, secureCookieOptions, setCookie } from "@/cookie.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { OAuthErrorResponse, AuthConfigInternal } from "@/@types/index.js"

const signInConfig = (oauth: AuthConfigInternal["oauth"]) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[]),
                redirectTo: z.string().optional(),
            }),
        },
    })
}

export const signInAction = (oauth: AuthConfigInternal["oauth"]) => {
    return createEndpoint(
        "GET",
        "/signIn/:oauth",
        async (ctx) => {
            const {
                request,
                params: { oauth, redirectTo },
                context: { oauth: oauthIntegrations, cookies },
            } = ctx
            try {
                const cookieOptions = secureCookieOptions(request, cookies)
                const state = generateSecure()
                const redirectURI = createRedirectURI(request.url, oauth)
                const stateCookie = setCookie("state", state, oauthCookie(cookieOptions))
                const redirectURICookie = setCookie("redirect_uri", redirectURI, oauthCookie(cookieOptions))
                const redirectToCookie = setCookie(
                    "redirect_to",
                    createRedirectTo(request, redirectTo),
                    oauthCookie(cookieOptions)
                )

                const { codeVerifier, codeChallenge, method } = await createPKCE()
                const codeVerifierCookie = setCookie("code_verifier", codeVerifier, oauthCookie(cookieOptions))

                const authorization = createAuthorizationURL(oauthIntegrations[oauth], redirectURI, state, codeChallenge, method)
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
                    return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                        { error: type, error_description: message },
                        { status: statusCode.BAD_REQUEST }
                    )
                }
                return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                    { error: ERROR_RESPONSE.AUTHORIZATION.SERVER_ERROR, error_description: "An unexpected error occurred" },
                    { status: statusCode.INTERNAL_SERVER_ERROR }
                )
            }
        },
        signInConfig(oauth)
    )
}
