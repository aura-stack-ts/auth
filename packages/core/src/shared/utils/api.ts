import { HeadersBuilder } from "@aura-stack/router"
import { verifyCSRF } from "@/exports/crypto.ts"
import { getCookie } from "@/shared/http/cookie.ts"
import { getErrorName } from "@/errors/aura-error.ts"
import { createRedirectTo } from "@/shared/oauth2/authorization.ts"
import { AuraAuthError, isAuraAuthError } from "@/errors/aura-error.ts"
import type { LOG_MESSAGES } from "@/config/logger/catalog.ts"
import type { InternalCookieStoreConfig, InternalLogger, RouterGlobalContext } from "@/@types/internal.ts"

export const handleApiError = (error: unknown, defaultCode: string, defaultMessage: string, defaultStatus = 400) => {
    let code = defaultCode
    let message = defaultMessage
    let statusCode = defaultStatus
    if (isAuraAuthError(error)) {
        code = error.code
        message = error.userMessage
        statusCode = error.statusCode
    }
    return { code, message, errors: { code, message }, statusCode }
}

export const resolveApiRedirect = async ({
    ctx,
    headers,
    redirectInit,
    redirectTo,
    request,
    fallbackRedirectTo,
}: {
    ctx: RouterGlobalContext
    request: Request
    redirectInit: boolean
    redirectTo: string | undefined
    headers: Headers | HeadersBuilder
    fallbackRedirectTo: string | undefined
}) => {
    let redirectURL: string | null = await createRedirectTo(request, redirectTo, ctx, fallbackRedirectTo)
    redirectURL = redirectTo ? redirectURL : redirectURL === "/" ? null : redirectURL

    if (redirectInit && redirectURL) {
        if (headers instanceof HeadersBuilder) {
            headers.setHeader("Location", redirectURL)
        } else {
            headers.set("Location", redirectURL)
        }
    }

    const shouldRedirectServer = redirectInit && !!redirectURL
    return {
        redirect: shouldRedirectServer,
        redirectURL: shouldRedirectServer ? null : redirectURL,
        status: shouldRedirectServer ? 302 : 200,
    }
}

export const internal_verifyCSRFToken = async ({
    headers,
    skipCSRFCheck,
    doubleSubmitToken,
    ctx,
    csrfTokenValue,
    cookieStore,
}: {
    headers: Headers
    skipCSRFCheck: boolean
    doubleSubmitToken?: string
    csrfTokenValue?: string
    ctx: RouterGlobalContext
    cookieStore: InternalCookieStoreConfig
}): Promise<boolean> => {
    let csrfToken = csrfTokenValue || null

    try {
        csrfToken = csrfToken || getCookie(headers, cookieStore.csrfToken.name)
    } catch (cause) {
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING", cause })
    }

    if (!csrfToken) {
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
    }

    try {
        await ctx.jose.instance.verifyJWS(csrfToken)
    } catch (cause) {
        throw new AuraAuthError({
            code: "CSRF_TOKEN_MISMATCH",
            cause,
        })
    }

    if (skipCSRFCheck && !doubleSubmitToken) {
        return true
    }

    const requestToken = doubleSubmitToken ?? headers.get("X-CSRF-Token")

    if (!requestToken) {
        throw new AuraAuthError({ code: "CSRF_DOUBLE_SUBMIT_FAILED" })
    }

    try {
        await verifyCSRF(ctx.jose.instance, csrfToken, requestToken)
    } catch (cause) {
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISMATCH", cause })
    }

    ctx.logger?.log("CSRF_TOKEN_VERIFIED")
    return true
}

export const errorToLogMessage = (error: unknown, key: keyof typeof LOG_MESSAGES, logger?: InternalLogger) => {
    logger?.log(key, {
        structuredData: {
            error_type: getErrorName(error),
            error_code: error instanceof AuraAuthError ? error.code : "UNKNOWN_ERROR",
            error_message: error instanceof AuraAuthError ? error.message : String(error),
        },
    })
}
