import { encode } from "@aura-stack/session"
import { expiredCookieOptions } from "@aura-stack/session/cookie"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { JWTPayload } from "jose"
import type { AuthConfigInternal } from "@/@types/index.js"
import { equals } from "@/utils.js"
import { getUserInfo } from "./userinfo.js"
import { createAccessToken } from "./access-token.js"
import { OAuthAuthorizationSearchParams } from "@/schemas.js"
import { getCookiesByNames, setCookiesByNames } from "@/cookie.js"

export const callbackAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (request, ctx) => {
            const oauth = ctx.params.oauth as keyof typeof oauthIntegrations
            if (!(oauth in oauthIntegrations)) {
                return Response.json({ error: "OAuth provider not supported" }, { status: 400 })
            }
            const oauthConfig = oauthIntegrations[oauth]
            const { code, state } = ctx.searchParams
            const {
                state: cookieState,
                original_uri: cookieOriginalURI,
                redirect_uri: cookieRedirectURI,
            } = getCookiesByNames(request, ["state", "original_uri", "redirect_uri"])

            if (equals(cookieState, state)) {
                return Response.json({ error: "Mismatching state" }, { status: 400 })
            }

            const accessToken = await createAccessToken(oauthConfig, code, cookieRedirectURI as string)
            if (accessToken instanceof Response) {
                return accessToken
            }

            const headers = new Headers()
            headers.set("Location", cookieOriginalURI as string)
            const userInfo = await getUserInfo(oauthConfig, accessToken)
            if (userInfo instanceof Response) {
                return userInfo
            }

            const sessionCookie = await encode("sessionToken", userInfo as never as JWTPayload)

            const expiredCookies = setCookiesByNames(
                {
                    state,
                    redirect_uri: "",
                    original_uri: "",
                },
                expiredCookieOptions
            )
            headers.set("Set-Cookie", `${sessionCookie}; ${expiredCookies}`)
            return Response.json({ oauth }, { status: 200, headers })
        },
        config
    )
}

const config = createEndpointConfig("/callback/:oauth", {
    schemas: {
        searchParams: OAuthAuthorizationSearchParams,
    },
})
