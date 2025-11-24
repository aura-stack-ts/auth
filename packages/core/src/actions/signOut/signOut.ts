import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { decodeJWT } from "@/jose.js"
import { AuthError } from "@/error.js"
import { verifyCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { AuraResponse } from "@/response.js"
import { AuthConfigInternal, OAuthErrorResponse } from "@/@types/index.js"
import { expireCookie, getCookie, secureCookieOptions } from "@/cookie.js"

const config = createEndpointConfig({
    schemas: {
        searchParams: z.object({
            token_type_hint: z.literal("session_token"),
        }),
        body: z.object({
            csrfToken: z.string(),
        }),
    },
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7009
 */
export const signOutAction = (authConfig: AuthConfigInternal) => {
    const { cookies } = authConfig

    return createEndpoint(
        "POST",
        "/signOut",
        async (request, ctx) => {
            try {
                const cookiesOptions = secureCookieOptions(request, cookies)
                const session = getCookie(request, "sessionToken", cookiesOptions)
                const csrfToken = getCookie(request, "csrfToken", { ...cookiesOptions, prefix: "__Host-", sameSite: "strict" })
                if (!verifyCSRF(ctx.body.csrfToken, csrfToken)) {
                    throw new AuthError("invalid_session_token", "The provided CSRF token is invalid or has expired")
                }
                await decodeJWT(session)
                const headers = new Headers(cacheControl)
                const expiredSessionToken = expireCookie("sessionToken", cookiesOptions)
                headers.set("Set-Cookie", expiredSessionToken)
                return Response.json({ message: "Signed out successfully" }, { status: statusCode.ACCEPTED, headers })
            } catch {
                return AuraResponse.json<OAuthErrorResponse<"signOut">>(
                    {
                        error: "invalid_session_token",
                        error_description: "The provided sessionToken is invalid or has already expired",
                    },
                    { status: statusCode.UNAUTHORIZED }
                )
            }
        },
        config
    )
}
