import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig, HeadersBuilder, statusCode } from "@aura-stack/router"
import { verifyCSRF } from "@/secure.ts"
import { secureApiHeaders } from "@/headers.ts"
import { AuthSecurityError } from "@/errors.ts"
import { getBaseURL, getErrorName } from "@/utils.ts"
import { expiredCookieAttributes } from "@/cookie.ts"
import { createRedirectTo } from "@/actions/signIn/authorization.ts"

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
            context,
        } = ctx

        const { jose, cookies, logger } = context
        const session = headers.getCookie(cookies.sessionToken.name)
        const csrfToken = headers.getCookie(cookies.csrfToken.name)
        const header = headers.getHeader("X-CSRF-Token")

        logger?.log("SIGN_OUT_ATTEMPT", {
            structuredData: {
                has_session: Boolean(session),
                has_csrf_token: Boolean(csrfToken),
                has_csrf_header: Boolean(header),
            },
        })

        if (!session) {
            logger?.log("SESSION_TOKEN_MISSING")
            throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
        }
        if (!csrfToken) {
            logger?.log("CSRF_TOKEN_MISSING")
            throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
        }
        if (!header) {
            logger?.log("CSRF_HEADER_MISSING")
            throw new AuthSecurityError("CSRF_HEADER_MISSING", "The CSRF header is missing.")
        }
        try {
            await verifyCSRF(jose, csrfToken, header)
        } catch (error) {
            logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
        }
        logger?.log("SIGN_OUT_CSRF_VERIFIED")
        try {
            await jose.decodeJWT(session)
            logger?.log("SIGN_OUT_SUCCESS")
        } catch (error) {
            logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
        }
        const baseURL = getBaseURL(request)
        const location = await createRedirectTo(
            new Request(baseURL, {
                headers: headers.toHeaders(),
            }),
            redirectTo,
            context
        )
        logger?.log("SIGN_OUT_REDIRECT", { structuredData: { location } })
        const headersList = new HeadersBuilder(secureApiHeaders)
            .setHeader("Location", location)
            .setCookie(cookies.csrfToken.name, "", expiredCookieAttributes)
            .setCookie(cookies.sessionToken.name, "", expiredCookieAttributes)
            .toHeaders()
        return Response.json({ message: "Signed out successfully" }, { status: statusCode.ACCEPTED, headers: headersList })
    },
    config
)
