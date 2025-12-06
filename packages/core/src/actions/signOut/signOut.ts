import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { decodeJWT } from "@/jose.js"
import { verifyCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { AuraResponse } from "@/response.js"
import { AuthConfigInternal, OAuthErrorResponse } from "@/@types/index.js"
import { expireCookie, getCookie, secureCookieOptions } from "@/cookie.js"
import { createRedirectTo } from "../signIn/authorization.js"
import { InvalidCsrfTokenError, InvalidRedirectToError } from "@/error.js"
import { getNormalizedOriginPath } from "@/utils.js"

const config = createEndpointConfig({
    schemas: {
        searchParams: z.object({
            token_type_hint: z.literal("session_token"),
            redirectTo: z.string().optional(),
        }),
    },
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7009
 */
export const signOutAction = ({ cookies }: AuthConfigInternal) => {
    return createEndpoint(
        "POST",
        "/signOut",
        async (request, ctx) => {
            try {
                const cookiesOptions = secureCookieOptions(request, cookies)
                const session = getCookie(request, "sessionToken", cookiesOptions)
                const csrfToken = getCookie(request, "csrfToken", {
                    ...cookiesOptions,
                    prefix: cookiesOptions.secure ? "__Host-" : "",
                })
                const header = ctx.headers.get("X-CSRF-Token")
                if (!header || !session || !csrfToken) {
                    throw new Error("Missing CSRF token or session token")
                }
                await verifyCSRF(csrfToken, header)
                await decodeJWT(session)

                const normalizedOriginPath = getNormalizedOriginPath(request.url)
                const redirectTo = createRedirectTo(
                    new Request(normalizedOriginPath, {
                        headers: ctx.headers,
                    }),
                    ctx.searchParams.redirectTo
                )
                const headers = new Headers(cacheControl)
                headers.append("Set-Cookie", expireCookie("sessionToken", cookiesOptions))
                headers.append(
                    "Set-Cookie",
                    expireCookie("csrfToken", { ...cookiesOptions, prefix: cookiesOptions.secure ? "__Host-" : "" })
                )
                headers.append("Location", redirectTo)
                return Response.json({ message: "Signed out successfully" }, { status: statusCode.ACCEPTED, headers })
            } catch (error) {
                if (error instanceof InvalidCsrfTokenError) {
                    return AuraResponse.json<OAuthErrorResponse<"signOut">>(
                        {
                            error: "invalid_csrf_token",
                            error_description: "The provided CSRF token is invalid or has expired",
                        },
                        { status: statusCode.UNAUTHORIZED }
                    )
                }
                if (error instanceof InvalidRedirectToError) {
                    const { type, message } = error
                    return AuraResponse.json<OAuthErrorResponse<"signOut">>(
                        {
                            error: type,
                            error_description: message,
                        },
                        { status: statusCode.BAD_REQUEST }
                    )
                }
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
