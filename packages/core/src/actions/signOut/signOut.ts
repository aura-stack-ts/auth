import z from "zod"
import { createEndpoint, createEndpointConfig, statusCode } from "@aura-stack/router"
import { verifyCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { AuraResponse } from "@/response.js"
import { createRedirectTo } from "@/actions/signIn/authorization.js"
import { getNormalizedOriginPath } from "@/utils.js"
import { InvalidCsrfTokenError, InvalidRedirectToError } from "@/error.js"
import { expiresCookie, getCookie } from "@/cookie.js"
import type { TokenRevocationError } from "@/@types/index.js"

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
export const signOutAction = createEndpoint(
    "POST",
    "/signOut",
    async (ctx) => {
        const {
            request,
            headers,
            searchParams: { redirectTo },
            context: { jose, cookies },
        } = ctx
        try {
            const session = getCookie(request, cookies.sessionToken.name)
            const csrfToken = getCookie(request, cookies.csrfToken.name)
            const header = headers.get("X-CSRF-Token")
            if (!header || !session || !csrfToken) {
                throw new Error("Missing CSRF token or session token")
            }
            await verifyCSRF(jose, csrfToken, header)
            await jose.decodeJWT(session)

            const normalizedOriginPath = getNormalizedOriginPath(request.url)
            const location = createRedirectTo(
                new Request(normalizedOriginPath, {
                    headers,
                }),
                redirectTo
            )
            const responseHeaders = new Headers(cacheControl)
            responseHeaders.append("Set-Cookie", expiresCookie(cookies.sessionToken.name))
            responseHeaders.append("Set-Cookie", expiresCookie(cookies.csrfToken.name))
            responseHeaders.append("Location", location)
            return Response.json(
                { message: "Signed out successfully" },
                { status: statusCode.ACCEPTED, headers: responseHeaders }
            )
        } catch (error) {
            if (error instanceof InvalidCsrfTokenError) {
                return AuraResponse.json<TokenRevocationError>(
                    {
                        error: "invalid_csrf_token" as TokenRevocationError["error"],
                        error_description: "The provided CSRF token is invalid or has expired",
                    },
                    { status: statusCode.UNAUTHORIZED }
                )
            }
            if (error instanceof InvalidRedirectToError) {
                const { type, message } = error
                return AuraResponse.json<TokenRevocationError>(
                    {
                        error: type as TokenRevocationError["error"],
                        error_description: message,
                    },
                    { status: statusCode.BAD_REQUEST }
                )
            }
            return AuraResponse.json<TokenRevocationError>(
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
