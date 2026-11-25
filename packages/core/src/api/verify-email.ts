import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailAPIOptions, VerifyEmailAPIReturn } from "@/@types/api.ts"

export const verifyEmail = async (
    token: string,
    context: FunctionAPIContext<VerifyEmailAPIOptions>
): Promise<VerifyEmailAPIReturn> => {
    const { logger, session } = context.ctx
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit } = await createValidation(context)
            .buildRequest("/verifyEmail")
            .verifyRateLimit("verifyEmail")
            .execute()
        if (rateLimit) {
            return rateLimit as VerifyEmailAPIReturn
        }

        await session.strategy.verifyEmail({ token })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            request,
            headers,
        })

        return toAPIResponse<VerifyEmailAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(error, "VERIFY_EMAIL_ERROR", "An error occurred while verifying the email.")

        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<VerifyEmailAPIReturn>({
            success: false,
            redirect: false,
            redirectURL: null,
            silent: { error: errors },
            headers: outHeaders,
            status: statusCode,
        })
    }
}
