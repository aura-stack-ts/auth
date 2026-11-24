import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<CancelEmailChangeAPIOptions>): Promise<CancelEmailChangeAPIReturn> => {
    const { logger, session } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("CANCEL_EMAIL_CHANGE_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
                hasToken: Boolean(payload?.token),
            },
        })
        const validation = createValidation(ctx, requestInit, headersInit)
            .buildRequest("/email/change/cancel")
            .verifyRateLimit("cancelEmailChange")

        if (payload?.token) {
            const { request, rateLimit } = await validation.execute()
            requestInit = requestInit ?? request

            if (rateLimit) {
                return rateLimit
            }

            await session.strategy.cancelEmailChange({
                token: payload?.token,
                userId: undefined,
            })
        } else {
            const { request, rateLimit, userId } = await validation
                .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
                .verifySession()
                .execute()
            requestInit = requestInit ?? request

            if (rateLimit) {
                return rateLimit
            }

            await session.strategy.cancelEmailChange({
                token: undefined,
                userId: userId!,
            })
        }

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request: requestInit,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
        })

        return toAPIResponse<CancelEmailChangeAPIReturn>({
            success: true,
            headers,
            status,
            redirect,
            redirectURL,
        })
    } catch (error) {
        errorToLogMessage(error, "CANCEL_EMAIL_CHANGE_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CANCEL_EMAIL_CHANGE_ERROR",
            "An error occurred while canceling the email change."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<CancelEmailChangeAPIReturn>({
            success: false,
            status: statusCode,
            silent: { error: errors },
            headers: outHeaders,
            redirect: false,
            redirectURL: null,
        })
    }
}
