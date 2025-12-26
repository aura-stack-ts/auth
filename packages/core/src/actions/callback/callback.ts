import z from "zod"
import { createEndpoint, createEndpointConfig, HeadersBuilder, statusCode } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { AuraResponse } from "@/response.js"
import { getUserInfo } from "@/actions/callback/userinfo.js"
import { AuthError, ERROR_RESPONSE, isAuthError } from "@/errors.js"
import { equals, isValidRelativePath, sanitizeURL } from "@/utils.js"
import { createAccessToken } from "@/actions/callback/access-token.js"
import { OAuthAuthorizationErrorResponse, OAuthAuthorizationResponse } from "@/schemas.js"
import { createSessionCookie, getCookie, expiredCookieAttributes } from "@/cookie.js"
import type { JWTPayload } from "@/jose.js"
import type { AccessTokenError, AuthorizationError, AuthRuntimeConfig } from "@/@types/index.js"

const callbackConfig = (oauth: AuthRuntimeConfig["oauth"]) => {
    return createEndpointConfig("/callback/:oauth", {
        schemas: {
            searchParams: OAuthAuthorizationResponse,
            params: z.object({
                oauth: z.enum(Object.keys(oauth) as (keyof typeof oauth)[], "The OAuth provider is not supported or invalid."),
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
                context: { oauth: providers, cookies, jose },
            } = ctx
            try {
                const oauthConfig = providers[oauth]
                const cookieState = getCookie(request, cookies.state.name)
                const cookieRedirectTo = getCookie(request, cookies.redirect_to.name)
                const cookieRedirectURI = getCookie(request, cookies.redirect_uri.name)
                const codeVerifier = getCookie(request, cookies.code_verifier.name)

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

                const userInfo = await getUserInfo(oauthConfig, accessToken.access_token)

                const sessionCookie = await createSessionCookie(userInfo as JWTPayload, jose)

                const csrfToken = await createCSRF(jose)

                const headers = new HeadersBuilder(cacheControl)
                    .setHeader("Location", sanitized)
                    .setCookie(cookies.sessionToken.name, sessionCookie, cookies.sessionToken.attributes)
                    .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
                    .setCookie(cookies.state.name, "", expiredCookieAttributes)
                    .setCookie(cookies.redirect_uri.name, "", expiredCookieAttributes)
                    .setCookie(cookies.redirect_to.name, "", expiredCookieAttributes)
                    .setCookie(cookies.code_verifier.name, "", expiredCookieAttributes)
                    .toHeaders()
                return Response.json({ oauth }, { status: 302, headers: headers })
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
