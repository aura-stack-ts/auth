import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailChangeAPIOptions, VerifyEmailChangeAPIReturn } from "@/@types/api.ts"

export const verifyEmailChange = async ({
    payload,
    ctx,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<VerifyEmailChangeAPIOptions>): Promise<VerifyEmailChangeAPIReturn> => {
    const { logger, sessionStrategy } = ctx
    try {
        logger?.log("VERIFY_EMAIL_CHANGE_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })
        const { request, rateLimit, sessionId } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/email/change/verify")
            .verifyRateLimit("verifyEmailChange")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        const { success } = await sessionStrategy.verifyEmailChange(payload.token, sessionId!)

        const headers = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)
        const headersList = headers.toHeaders()

        return {
            success,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers: headersList,
            toResponse: () => {
                return Response.json(
                    {
                        success,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: headersList, status: redirect ? 302 : 200 }
                )
            },
        } as VerifyEmailChangeAPIReturn
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_CHANGE_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "VERIFY_EMAIL_CHANGE_ERROR",
            "An error occurred while verifying the email change."
        )
        return {
            success: false,
            error: errors,
            redirect: false,
            redirectURL: null,
            headers: new Headers(secureApiHeaders),
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: secureApiHeaders, status: statusCode }
                )
            },
        }
    }
}
