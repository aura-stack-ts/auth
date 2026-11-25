import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SendMagicLinkAPIOptions, SendMagicLinkAPIReturn } from "@/@types/api.ts"

export const sendMagicLink = async (
    email: string,
    context: FunctionAPIContext<SendMagicLinkAPIOptions>
): Promise<SendMagicLinkAPIReturn> => {
    const { logger, session, magicLinks } = context.ctx
    if (!magicLinks?.sendMagicLinkEmail) {
        throw new AuraAuthError({ code: "MAGIC_LINK_SEND_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, origin, cookieStore } = await createValidation(context)
            .buildRequest("/signIn/magicLink")
            .verifyRateLimit("sendMagicLink")
            .verifyCSRFToken()
            .execute()
        if (rateLimit) {
            return rateLimit as SendMagicLinkAPIReturn
        }
        const { token, url } = await session.strategy.sendMagicLink({
            email,
            origin,
            cookieStore,
            allowSignUp: magicLinks?.allowSignUp ?? false,
        })

        await magicLinks.sendMagicLinkEmail({ email, token, url })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            headers,
            request,
        })
        return toAPIResponse<SendMagicLinkAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "SEND_MAGIC_LINK_ERROR", logger)
        const { errors } = handleApiError(error, "SEND_MAGIC_LINK_ERROR", "An error occurred while sending the magic link.")
        const outHeaders = getAuraAuthHeaders(error, headers)
        /**
         * For security reasons, we always return a 200 status code to avoid leaking information
         * about the existence of the email address or enumeration attacks.
         */
        return toAPIResponse<SendMagicLinkAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: 200,
        })
    }
}
