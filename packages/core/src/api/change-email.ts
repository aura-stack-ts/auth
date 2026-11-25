import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ChangeEmailAPIOptions, ChangeEmailAPIReturn } from "@/@types/api.ts"

export const changeEmail = async (context: FunctionAPIContext<ChangeEmailAPIOptions>): Promise<ChangeEmailAPIReturn> => {
    const { logger, session, emailChange } = context.ctx
    if (!emailChange?.sendEmailChangeVerification) {
        throw new AuraAuthError({ code: "CHANGE_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = new Headers(secureApiHeaders)
    try {
        const { payload } = context
        const { request, rateLimit, userId, origin } = await createValidation(context)
            .buildRequest("/email/change")
            .verifyRateLimit("changeEmail")
            .verifySession()
            .verifyUserStatus("SILENT_USER_NOT_FOUND")
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        const { email, confirmToken, confirmURL, cancelToken, cancelURL } = await session.strategy.changeEmail({
            origin,
            userId: userId!,
            currentPassword: payload.currentPassword,
            newEmail: payload.newEmail,
        })
        await emailChange.sendEmailChangeVerification({
            email,
            newEmail: payload.newEmail,
            confirmToken,
            confirmURL,
            cancelToken,
            cancelURL,
        })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request,
        })

        return toAPIResponse<ChangeEmailAPIReturn>({
            success: true,
            headers,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "CHANGE_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CHANGE_EMAIL_ERROR",
            "An error occurred while changing the email address."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<ChangeEmailAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
