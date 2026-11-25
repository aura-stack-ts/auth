import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ForgotPasswordAPIOptions, ForgotPasswordAPIReturn } from "@/@types/api.ts"

export const forgotPassword = async (
    email: string,
    context: FunctionAPIContext<ForgotPasswordAPIOptions>
): Promise<ForgotPasswordAPIReturn> => {
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, origin } = await createValidation(context)
            .buildRequest("/password/forgot")
            .verifyRateLimit("forgotPassword")
            .execute()

        if (rateLimit) {
            return rateLimit as ForgotPasswordAPIReturn
        }
        const { token, url } = await context.ctx.session.strategy.forgotPassword({ email, origin })
        await context.ctx.passwordReset?.sendPasswordResetEmail?.({ email, token, url })

        const { redirect, redirectURL, status } = await getRedirectResponse({ context, headers, request })

        return toAPIResponse<ForgotPasswordAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "FORGOT_PASSWORD_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "FORGOT_PASSWORD_ERROR",
            "An error occurred while processing the forgot password request."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)

        return toAPIResponse<ForgotPasswordAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
