import { expiredCookieAttributes, getCookie } from "@/cookie.ts"
import { verifyCSRF } from "@/secure.ts"
import { getErrorName } from "@/utils.ts"
import { AuthSecurityError } from "@/errors.ts"
import { secureApiHeaders } from "@/headers.ts"
import { HeadersBuilder } from "@aura-stack/router"
import type { FunctionAPIContext, SignOutAPIOptions } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    headers: headersInit,
    redirectTo = "/",
    skipCSRFCheck = false,
}: FunctionAPIContext<SignOutAPIOptions>) => {
    const headers = new Headers(headersInit)
    const header = headers.get("X-CSRF-Token")
    let session = null
    let csrfToken = null
    try {
        session = getCookie(headers, ctx.cookies.sessionToken.name)
    } catch {
        throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
    }
    try {
        csrfToken = getCookie(headers, ctx.cookies.csrfToken.name)
    } catch {
        throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
    }
    ctx?.logger?.log("SIGN_OUT_ATTEMPT", {
        structuredData: {
            has_session: Boolean(session),
            has_csrf_token: Boolean(csrfToken),
            has_csrf_header: Boolean(header),
            skip_csrf_check: skipCSRFCheck,
        },
    })
    if (!session) {
        ctx?.logger?.log("SESSION_TOKEN_MISSING")
        throw new AuthSecurityError("SESSION_TOKEN_MISSING", "The sessionToken is missing.")
    }
    if (!skipCSRFCheck) {
        if (!csrfToken) {
            ctx?.logger?.log("CSRF_TOKEN_MISSING")
            throw new AuthSecurityError("CSRF_TOKEN_MISSING", "The CSRF token is missing.")
        }
        if (!header) {
            ctx?.logger?.log("CSRF_HEADER_MISSING")
            throw new AuthSecurityError("CSRF_HEADER_MISSING", "The CSRF header is missing.")
        }
        try {
            await verifyCSRF(ctx.jose, csrfToken, header)
        } catch (error) {
            ctx?.logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
        }
        ctx?.logger?.log("SIGN_OUT_CSRF_VERIFIED")
    } else {
        try {
            await ctx.jose.verifyJWS(csrfToken)
        } catch (error) {
            ctx?.logger?.log("CSRF_TOKEN_INVALID", { structuredData: { error_type: getErrorName(error) } })
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "CSRF token verification failed")
        }
    }
    try {
        await ctx.jose.decodeJWT(session)
        ctx?.logger?.log("SIGN_OUT_SUCCESS")
    } catch (error) {
        ctx?.logger?.log("INVALID_JWT_TOKEN", { structuredData: { error_type: getErrorName(error) } })
    }
    const headersList = new HeadersBuilder(secureApiHeaders)
        .setHeader("Location", redirectTo)
        .setCookie(ctx.cookies.csrfToken.name, "", expiredCookieAttributes)
        .setCookie(ctx.cookies.sessionToken.name, "", expiredCookieAttributes)
        .toHeaders()
    return Response.json(
        { redirect: Boolean(redirectTo), url: redirectTo },
        {
            status: 202,
            headers: headersList,
        }
    )
}
