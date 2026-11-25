import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ChangePasswordAPIOptions, ChangePasswordAPIReturn } from "@/@types/api.ts"

export const changePassword = async (context: FunctionAPIContext<ChangePasswordAPIOptions>): Promise<ChangePasswordAPIReturn> => {
    const { logger, session } = context.ctx
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, userId } = await createValidation(context)
            .buildRequest("/password/change")
            .verifyRateLimit("changePassword")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        await session.strategy.changePassword({
            userId: userId!,
            currentPassword: context.payload.currentPassword,
            newPassword: context.payload.newPassword,
        })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request,
        })

        return toAPIResponse<ChangePasswordAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "CHANGE_PASSWORD_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CHANGE_PASSWORD_ERROR",
            "An error occurred while changing the password."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)

        return toAPIResponse<ChangePasswordAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
