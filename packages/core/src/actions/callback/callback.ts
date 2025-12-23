import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { getUserInfo } from "./userinfo.js"
import { AuraResponse } from "@/response.js"
import { createAccessToken } from "./access-token.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/error.js"
import { equals, isValidRelativePath, sanitizeURL, useSecureCookies } from "@/utils.js"
import { OAuthAuthorizationErrorResponse, OAuthAuthorizationResponse } from "@/schemas.js"
import {
    createCookieStore,
    createSessionCookie,
    expiresCookie,
    setCookie,
    unstable__get_cookie,
} from "@/cookie.js"
import type { JWTPayload } from "@/jose.js"
import type { AccessTokenError, AuthorizationError, AuthRuntimeConfig } from "@/@types/index.js"

const callbackConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/callback/:oauth", {
        schemas: {
            searchParams: OAuthAuthorizationResponse,
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[]),
            }),
        },
        middlewares: [
            (ctx) => {
                const response = OAuthAuthorizationErrorResponse.safeParse(ctx.searchParams)
                if (response.success) {
                    const { error, error_description } = response.data
                    throw new AuthError(error, error_description ?? "OAuth Authorization Error")
                }
                return ctx
            },
        ],
    })
}

export const callbackAction = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (ctx) => {
            const {
                request,
                params: { oauth },
                searchParams: { code, state },
                context: { oauth: providers, jose, trustedProxyHeaders },
            } = ctx
            try {
                const useSecure = useSecureCookies(request, trustedProxyHeaders)
                /**
                 * @todo: pass the new cookie configuration option
                 */
                const cookieStore = createCookieStore(useSecure)
                const oauthConfig = providers[oauth]

                /*
                const cookieState = getCookie(request, "state", cookieOptions)
                const cookieRedirectTo = getCookie(request, "redirect_to", cookieOptions)
                const cookieRedirectURI = getCookie(request, "redirect_uri", cookieOptions)
                const codeVerifier = getCookie(request, "code_verifier", cookieOptions)
                */

                const cookieState = unstable__get_cookie(request, cookieStore.state.name)
                const cookieRedirectTo = unstable__get_cookie(request, cookieStore.redirect_to.name)
                const cookieRedirectURI = unstable__get_cookie(request, cookieStore.redirect_uri.name)
                const codeVerifier = unstable__get_cookie(request, cookieStore.code_verifier.name)

                if (!equals(cookieState, state)) {
                    throw new AuthError(ERROR_RESPONSE.ACCESS_TOKEN.INVALID_REQUEST, "Mismatching state")
                }

                const accessToken = await createAccessToken(oauthConfig, cookieRedirectURI, code, codeVerifier)
                const sanitized = sanitizeURL(cookieRedirectTo)
                if (!isValidRelativePath(sanitized)) {
                    throw new AuthError(
                        ERROR_RESPONSE.ACCESS_TOKEN.INVALID_REQUEST,
                        "Invalid redirect path. Potential open redirect attack detected."
                    )
                }

                const headers = new Headers(cacheControl)
                headers.set("Location", sanitized)
                const userInfo = await getUserInfo(oauthConfig, accessToken.access_token)

                const sessionCookie = await createSessionCookie(
                    userInfo as JWTPayload,
                    cookieStore.sessionToken.name,
                    cookieStore.sessionToken.attributes,
                    jose
                )

                const csrfToken = await createCSRF(jose)
                const csrfCookie = setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes)
                headers.set("Set-Cookie", sessionCookie)
                headers.append("Set-Cookie", expiresCookie(cookieStore.state.name))
                headers.append("Set-Cookie", expiresCookie(cookieStore.redirect_uri.name))
                headers.append("Set-Cookie", expiresCookie(cookieStore.redirect_to.name))
                headers.append("Set-Cookie", expiresCookie(cookieStore.code_verifier.name))
                headers.append("Set-Cookie", csrfCookie)
                return Response.json({ oauth }, { status: 302, headers })
            } catch (error) {
                if (isAuthError(error)) {
                    const { type, message } = error
                    return AuraResponse.json<AuthorizationError>(
                        { error: type as AuthorizationError["error"], error_description: message },
                        { status: statusCode.BAD_REQUEST }
                    )
                }
                return AuraResponse.json<AccessTokenError>(
                    {
                        error: ERROR_RESPONSE.ACCESS_TOKEN.INVALID_CLIENT as AccessTokenError["error"],
                        error_description: "An unexpected error occurred",
                    },
                    { status: statusCode.INTERNAL_SERVER_ERROR }
                )
            }
        },
        callbackConfig(oauth)
    )
}
