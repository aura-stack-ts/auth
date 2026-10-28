import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { CancelEmailChangeAPIOptions, CancelEmailChangeAPIReturn } from "@/@types/api.ts"

export const cancelEmailChange = async ({
    ctx,
    payload,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<CancelEmailChangeAPIOptions>): Promise<CancelEmailChangeAPIReturn> => {
    const { logger, sessionStrategy } = ctx
    try {
        logger?.log("CANCEL_EMAIL_CHANGE_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
                hasToken: Boolean(payload?.token),
            },
        })

        const validation = createValidation(ctx, toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {}))
            .buildRequest(requestInit, "/email/change/cancel")
            .verifyRateLimit("cancelEmailChange")

        if (payload?.token) {
            const { request, rateLimit } = await validation.execute()
            await sessionStrategy.cancelEmailChange({
                token: payload?.token,
                userId: undefined,
            })
            requestInit = requestInit ?? request

            if (rateLimit) {
                return rateLimit
            }
        } else {
            const { request, rateLimit, userId } = await validation
                .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
                .verifySession()
                .execute()
            requestInit = requestInit ?? request

            if (rateLimit) {
                return rateLimit
            }

            await sessionStrategy.cancelEmailChange({
                token: undefined,
                userId: userId!,
            })
        }

        const headers = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, requestInit, redirectInit, redirectTo, headers)
        const headersList = headers.toHeaders()

        return {
            success: true,
            redirect,
            redirectURL: redirectInit ? null : redirectURL,
            headers: headersList,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: headersList, status: redirect ? 302 : 200 }
                )
            },
        } as CancelEmailChangeAPIReturn
    } catch (error) {
        errorToLogMessage(error, "CANCEL_EMAIL_CHANGE_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CANCEL_EMAIL_CHANGE_ERROR",
            "An error occurred while canceling the email change."
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
