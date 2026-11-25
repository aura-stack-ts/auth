import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"

export const signOut = async (context: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, rawSession, cookieStore } = await createValidation(context)
            .buildRequest("/signOut")
            .verifyRateLimit("signOut")
            .verifySession()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const { headers } = await context.ctx.session.strategy.destroySession({
            rawSession,
            cookieStore,
            headers: initHeaders,
        })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            request,
            headers,
            status: 202,
        })

        return toAPIResponse<SignOutAPIReturn>({
            success: true,
            headers,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "SIGN_OUT_FAILED", context.ctx.logger)
        const { errors, statusCode } = handleApiError(error, "SIGN_OUT_FAILED", "Failed to sign-out session")
        const headers = getAuraAuthHeaders(error, initHeaders)
        return toAPIResponse<SignOutAPIReturn>({
            success: false,
            headers,
            redirect: false,
            redirectURL: null,
            silent: { error: errors },
            status: statusCode,
        })
    }
}
