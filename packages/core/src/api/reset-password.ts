import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ResetPasswordAPIOptions, ResetPasswordAPIReturn } from "@/@types/api.ts"

export const resetPassword = async ({
    ctx,
    headers: headersInit,
    request: requestInit,
    payload,
    redirectTo,
    redirect: redirectInit = true,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<ResetPasswordAPIOptions>): Promise<ResetPasswordAPIReturn> => {
    const { logger, session } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("RESET_PASSWORD_INITIATED")
        const { request, rateLimit } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/password/reset")
            .verifyRateLimit("resetPassword")
            .execute()
        if (rateLimit) {
            return rateLimit as ResetPasswordAPIReturn
        }

        await session.strategy.resetPassword(payload)

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
        })

        return toAPIResponse<ResetPasswordAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "RESET_PASSWORD_ERROR", logger)
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
