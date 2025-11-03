import z from "zod"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { AuthConfigInternal, ErrorResponse, OAuthUserProfile } from "@/@types/index.js"
import { equals } from "@/utils.js"
import { getUserInfo } from "./userinfo.js"
import { createAccessToken } from "./access-token.js"
import { OAuthAccessTokenResponse, OAuthAuthorizationSearchParams } from "@/schemas.js"
import { createSessionCookie, expiredCookieOptions, getCookiesByNames, setCookiesByNames } from "@/cookie.js"
import { AuraResponse } from "@/response.js"
import { AuraAuthError, isAuraAuthError } from "@/error.js"
import { JWTPayload } from "@/jose.js"

export const callbackAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (request, ctx) => {
            const oauth = ctx.params.oauth as keyof typeof oauthIntegrations
            try {
                if (!(oauth in oauthIntegrations)) {
                    throw new AuraAuthError("invalid_request", "Unsupported OAuth Social Integration")
                }
                const oauthConfig = oauthIntegrations[oauth]
                const { code, state } = ctx.searchParams

                const {
                    state: cookieState,
                    original_uri: cookieOriginalURI,
                    redirect_uri: cookieRedirectURI,
                } = getCookiesByNames(request.headers.get("Cookie") ?? "", ["state", "original_uri", "redirect_uri"])

                if (!equals(cookieState, state)) {
                    throw new AuraAuthError("invalid_request", "Mismatching state")
                }

                const accessToken = (await createAccessToken(oauthConfig, cookieRedirectURI, code)) as z.infer<
                    typeof OAuthAccessTokenResponse
                >

                const headers = new Headers()
                headers.set("Location", cookieOriginalURI)
                const userInfo = (await getUserInfo(oauthConfig, accessToken.access_token)) as OAuthUserProfile

                const sessionCookie = await createSessionCookie(userInfo as never as JWTPayload)

                const expiredCookies = setCookiesByNames(
                    {
                        state: "",
                        redirect_uri: "",
                        original_uri: "",
                    },
                    expiredCookieOptions
                )
                headers.set("Set-Cookie", `${sessionCookie}; ${expiredCookies}`)
                return Response.json({ oauth }, { status: 302, headers })
            } catch (error) {
                if (isAuraAuthError(error)) {
                    const { type, message } = error
                    return AuraResponse.json<ErrorResponse>({ error: type, error_description: message }, { status: 400 })
                }
                return AuraResponse.json<ErrorResponse>(
                    { error: "server_error", error_description: "An unexpected error occurred" },
                    { status: 500 }
                )
            }
        },
        config
    )
}

const config = createEndpointConfig("/callback/:oauth", {
    schemas: {
        searchParams: OAuthAuthorizationSearchParams,
    },
})
