import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ChangePasswordAPIOptions, ChangePasswordAPIReturn } from "@/@types/api.ts"

export const changePassword = async ({
    payload,
    ctx,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<ChangePasswordAPIOptions>): Promise<ChangePasswordAPIReturn> => {
    const { logger, session } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("CHANGE_PASSWORD_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, userId } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/password/change")
            .verifyRateLimit("changePassword")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        await session.strategy.changePassword({
            userId: userId!,
            currentPassword: payload.currentPassword,
            newPassword: payload.newPassword,
        })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
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
