import z from "zod"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { OAuthErrorResponse } from "@/@types/index.js"
import { expiredCookieOptions, getCookie, setCookie } from "@/cookie.js"
import { cacheControl } from "@/headers.js"
import { decodeJWT } from "@/jose.js"
import { AuraResponse } from "@/response.js"

const config = createEndpointConfig({
    schemas: {
        searchParams: z.object({
            token_type_hint: z.literal("session_token"),
        }),
    },
})

/**
 * @todo: supports CSRF protection
 * @see https://datatracker.ietf.org/doc/html/rfc7009
 */
export const signOutAction = createEndpoint(
    "POST",
    "/signOut",
    async (request) => {
        try {
            const session = getCookie(request, "sessionToken")
            await decodeJWT(session)
            const headers = new Headers(cacheControl)
            const expiredSessionToken = setCookie("sessionToken", "", expiredCookieOptions)
            headers.set("Set-Cookie", expiredSessionToken)
            return Response.json({ message: "Signed out successfully" }, { status: 200, headers })
        } catch {
            return AuraResponse.json<OAuthErrorResponse<"signOut">>(
                {
                    error: "invalid_session_token",
                    error_description: "The provided sessionToken is invalid or has already expired",
                },
                { status: 400 }
            )
        }
    },
    config
)
