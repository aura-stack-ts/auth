import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailAPIOptions, VerifyEmailAPIReturn } from "@/@types/api.ts"

export const verifyEmail = async (
    token: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
        fallbackRedirectTo = undefined,
    }: FunctionAPIContext<VerifyEmailAPIOptions>
): Promise<VerifyEmailAPIReturn> => {
    const { logger, session } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("VERIFY_EMAIL_INITIATED")
        const { request, rateLimit } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/verifyEmail")
            .verifyRateLimit("verifyEmail")
            .execute()
        if (rateLimit) {
            return rateLimit as VerifyEmailAPIReturn
        }

        await session.strategy.verifyEmail({ token })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
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
