import { AuraAuthError } from "@/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ChangeEmailAPIOptions, ChangeEmailAPIReturn } from "@/@types/api.ts"

export const changeEmail = async ({
    payload,
    ctx,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    doubleSubmitToken = undefined,
    skipCSRFCheck = false,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<ChangeEmailAPIOptions>): Promise<ChangeEmailAPIReturn> => {
    const { logger, session, emailChange } = ctx
    if (!emailChange?.sendEmailChangeVerification) {
        throw new AuraAuthError({ code: "CHANGE_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("CHANGE_EMAIL_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })
        const { request, rateLimit, userId, origin } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/email/change")
            .verifyRateLimit("changeEmail")
            .verifySession()
            .verifyUserStatus("SILENT_USER_NOT_FOUND")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
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

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
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
