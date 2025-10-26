import z from "zod"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { encode } from "@aura-stack/session"
import type { AuthConfigInternal } from "@/@types/index.js"
import { createAccessToken } from "./access-token.js"
import { expiredCookieOptions, setCookie, getCookie } from "@/cookie.js"
import { getUserInfo } from "./userinfo.js"
import type { JWTPayload } from "jose"
import { createRedirectURI } from "@/utils.js"

export const callbackAction = (authConfig: AuthConfigInternal) => {
    const { oauth: oauthIntegrations } = authConfig

    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (request, ctx) => {
            const oauth = ctx.params.oauth as keyof typeof oauthIntegrations
            if (!(oauth in oauthIntegrations)) {
                return Response.json({ message: "OAuth provider not supported" }, { status: 400 })
            }
            const oauthConfig = oauthIntegrations[oauth]

            const { code, state } = ctx.searchParams
            const cookies = ctx.headers.get("Cookie")
            const inferRedirectURL = createRedirectURI(request.url, oauth)
            const cookieState = getCookie(request, "state")

            if (!code || !state) {
                return Response.json({ message: "Missing code or state" }, { status: 400 })
            }
            if (cookieState !== state) {
                return Response.json({ message: "Missing cookies" }, { status: 400 })
            }
            const accessToken = await createAccessToken(oauthConfig, code, inferRedirectURL)
            const headers = new Headers()
            headers.set("Location", "http://localhost:3000")

            /*
            const userInfo = await getUserInfo(oauthConfig.userInfo, accessToken)
            const sessionCookie = await encode("sessionToken", userInfo as never as JWTPayload)

            const stateCookie = setCookie("state", "", expiredCookieOptions)
            headers.set("Set-Cookie", `${sessionCookie}; ${stateCookie}`)
            */
            return Response.json({ oauth }, { status: 200, headers })
        },
        config
    )
}

const config = createEndpointConfig("/callback/:oauth", {
    schemas: {
        searchParams: z.object({
            code: z.string(),
            state: z.string(),
        }),
    },
})
