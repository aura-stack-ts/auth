import { z } from "zod"
import { createEndpoint, createEndpointConfig, HeadersBuilder, statusCode } from "@aura-stack/router"
import { getBaseURL } from "@/utils.js"
import { verifyCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { AuthSecurityError } from "@/errors.js"
import { expiredCookieAttributes } from "@/cookie.js"
import { createRedirectTo } from "@/actions/signIn/authorization.js"

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
            context: { jose, cookies, trustedProxyHeaders, logger },
        } = ctx

        const session = headers.getCookie(cookies.sessionToken.name)
        const csrfToken = headers.getCookie(cookies.csrfToken.name)
        const header = headers.getHeader("X-CSRF-Token")

        logger?.log({
            facility: 4,
            severity: "debug",
            msgId: "SIGN_OUT_ATTEMPT",
            message: "Sign out attempt received",
            structuredData: {
                has_session: session ? "true" : "false",
                has_csrf_token: csrfToken ? "true" : "false",
                has_csrf_header: header ? "true" : "false",
            },
        })

        if (!session) {
            logger?.log({
                facility: 4,
                severity: "warning",
                msgId: "SESSION_TOKEN_MISSING",
                message: "The sessionToken is missing",
            })
            throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
        }
        if (!csrfToken) {
            logger?.log({
                facility: 4,
                severity: "warning",
                msgId: "CSRF_TOKEN_MISSING",
                message: "The CSRF token is missing from cookies",
            })
            throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
        }
        if (!header) {
            logger?.log({
                facility: 4,
                severity: "warning",
                msgId: "CSRF_HEADER_MISSING",
                message: "The CSRF header is missing",
            })
            throw new AuthSecurityError("CSRF_HEADER_MISSING", "The CSRF header is missing.")
        }
        try {
            await verifyCSRF(jose, csrfToken, header)
        } catch (error) {
            logger?.log({
                facility: 4,
                severity: "error",
                msgId: "CSRF_TOKEN_INVALID",
                message: "CSRF token verification failed",
                structuredData: {
                    error_type: error instanceof Error ? error.name : "Unknown",
                },
            })
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
        }
        logger?.log({
            facility: 4,
            severity: "info",
            msgId: "SIGN_OUT_CSRF_VERIFIED",
            message: "CSRF token verified successfully.",
        })
        try {
            await jose.decodeJWT(session)
            logger?.log({
                facility: 4,
                severity: "info",
                msgId: "SIGN_OUT_SUCCESS",
                message: "Sign out completed successfully",
            })
        } catch (error) {
            logger?.log({
                facility: 4,
                severity: "warning",
                msgId: "INVALID_JWT_TOKEN",
                message: "Invalid session token during sign out",
                structuredData: {
                    error_type: error instanceof Error ? error.name : "Unknown",
                },
            })
        }
        const baseURL = getBaseURL(request)
        const location = createRedirectTo(
            new Request(baseURL, {
                headers: headers.toHeaders(),
            }),
            redirectTo,
            trustedProxyHeaders
        )
        logger?.log({
            facility: 4,
            severity: "debug",
            msgId: "SIGN_OUT_REDIRECT",
            message: `Redirecting to ${location}.`,
        })
        const headersList = new HeadersBuilder(cacheControl)
            .setHeader("Location", location)
            .setCookie(cookies.csrfToken.name, "", expiredCookieAttributes)
            .setCookie(cookies.sessionToken.name, "", expiredCookieAttributes)
            .toHeaders()
        return Response.json({ message: "Signed out successfully" }, { status: statusCode.ACCEPTED, headers: headersList })
    },
    config
)
