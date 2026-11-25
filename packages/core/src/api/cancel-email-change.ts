import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { CancelEmailChangeAPIOptions, CancelEmailChangeAPIReturn } from "@/@types/api.ts"

export const cancelEmailChange = async (
    context: FunctionAPIContext<CancelEmailChangeAPIOptions>
): Promise<CancelEmailChangeAPIReturn> => {
    const {
        ctx: { logger, session },
        payload,
    } = context
    const headers = new Headers(secureApiHeaders)
    try {
        const validation = createValidation(context).buildRequest("/email/change/cancel").verifyRateLimit("cancelEmailChange")

        if (payload?.token) {
            const { request, rateLimit } = await validation.execute()
            context.request = context.request ?? request

            if (rateLimit) {
                return rateLimit
            }

            await session.strategy.cancelEmailChange({
                token: payload?.token,
                userId: undefined,
            })
        } else {
            const { request, rateLimit, userId } = await validation.verifyCSRFToken().verifySession().execute()
            context.request = context.request ?? request

            if (rateLimit) {
                return rateLimit
            }

            await session.strategy.cancelEmailChange({
                token: undefined,
                userId: userId!,
            })
        }

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request: context.request,
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
