import { createEndpoint } from "@aura-stack/router"
import { createPKCE, generateSecure } from "@/secure.js"
import { AuraResponse } from "@/response.js"
import { oauthCookie, secureCookieOptions, setCookie } from "@/cookie.js"
import { integrations } from "@/oauth/index.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { createAuthorizationURL, createRedirectURI, createRedirectTo } from "@/actions/signIn/authorization.js"
import type { OAuthErrorResponse, AuthConfigInternal } from "@/@types/index.js"

export const signInAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations, cookies } = authConfig

    return createEndpoint("GET", "/signIn/:oauth", async (request, ctx) => {
        const oauth = ctx.params.oauth as keyof typeof integrations
        try {
            if (!(oauth in oauthIntegrations)) {
                throw new AuthError("invalid_request", "Unsupported OAuth Social Integration")
            }
            const cookieOptions = secureCookieOptions(request, cookies)
            const state = generateSecure()
            const redirectURI = createRedirectURI(request.url, oauth)
            const stateCookie = setCookie("state", state, oauthCookie(cookieOptions))
            const redirectURICookie = setCookie("redirect_uri", redirectURI, oauthCookie(cookieOptions))
            const redirectToCookie = setCookie("redirect_to", createRedirectTo(request), oauthCookie(cookieOptions))

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
                    { status: 400 }
                )
            }
            return AuraResponse.json<OAuthErrorResponse<"authorization">>(
                { error: ERROR_RESPONSE.AUTHORIZATION.SERVER_ERROR, error_description: "An unexpected error occurred" },
                { status: 500 }
            )
        }
    })
}
