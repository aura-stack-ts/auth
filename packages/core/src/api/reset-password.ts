import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ResetPasswordAPIOptions, ResetPasswordAPIReturn } from "@/@types/api.ts"

export const resetPassword = async (context: FunctionAPIContext<ResetPasswordAPIOptions>): Promise<ResetPasswordAPIReturn> => {
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit } = await createValidation(context)
            .buildRequest("/password/reset")
            .verifyRateLimit("resetPassword")
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        await context.ctx.session.strategy.resetPassword(context.payload)

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request,
        })

        return toAPIResponse<ResetPasswordAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "RESET_PASSWORD_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "RESET_PASSWORD_ERROR",
            "An error occurred while resetting the password."
        )

        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<ResetPasswordAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
