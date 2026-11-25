import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SendVerificationEmailAPIOptions, SendVerificationEmailAPIReturn } from "@/@types/api.ts"

export const sendVerificationEmail = async (
    email: string,
    context: FunctionAPIContext<SendVerificationEmailAPIOptions>
): Promise<SendVerificationEmailAPIReturn> => {
    const { logger, session, emailVerification } = context.ctx
    if (!emailVerification?.sendVerificationEmail) {
        throw new AuraAuthError({ code: "SEND_VERIFICATION_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("SEND_VERIFICATION_EMAIL_INITIATED")
        const { request, rateLimit, origin } = await createValidation(context)
            .buildRequest("/sendVerificationEmail")
            .verifyRateLimit("sendVerificationEmail")
            .verifySession()
            .verifyCSRFToken()
            .execute()
        if (rateLimit) {
            return rateLimit
        }
        const { token, url } = await session.strategy.sendVerificationEmail({
            email,
            origin,
        })
        await emailVerification.sendVerificationEmail({ email, token, url })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request,
        })

        return toAPIResponse<SendVerificationEmailAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "SEND_VERIFICATION_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "SEND_VERIFICATION_EMAIL_ERROR",
            "An error occurred while sending the verification email."
        )
        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<SendVerificationEmailAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
