import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailChangeAPIOptions, VerifyEmailChangeAPIReturn } from "@/@types/api.ts"

export const verifyEmailChange = async (
    context: FunctionAPIContext<VerifyEmailChangeAPIOptions>
): Promise<VerifyEmailChangeAPIReturn> => {
    const { logger, session } = context.ctx
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, userId, sessionId } = await createValidation(context)
            .buildRequest("/email/change/verify")
            .verifyRateLimit("verifyEmailChange")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        await session.strategy.verifyEmailChange({
            sessionId: sessionId!,
            userId: userId!,
            token: context.payload.token,
        })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            request,
            headers,
        })

        return toAPIResponse<VerifyEmailChangeAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_CHANGE_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "VERIFY_EMAIL_CHANGE_ERROR",
            "An error occurred while verifying the email change."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<VerifyEmailChangeAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
