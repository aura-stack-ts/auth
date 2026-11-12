import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ResetPasswordAPIOptions, ResetPasswordAPIReturn } from "@/@types/api.ts"

export const resetPassword = async ({
    ctx,
    headers: headersInit,
    request: requestInit,
    payload,
    redirectTo,
    redirect: redirectInit = true,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<ResetPasswordAPIOptions>): Promise<ResetPasswordAPIReturn> => {
    const { logger, session } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("RESET_PASSWORD_INITIATED")
        const { request, rateLimit } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/password/reset")
            .verifyRateLimit("resetPassword")
            .execute()
        if (rateLimit) {
            return rateLimit as ResetPasswordAPIReturn
        }

        await session.strategy.resetPassword(payload)

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
        })

        return {
            success: true,
            redirect,
            redirectURL,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL,
                    },
                    { headers, status }
                )
            },
        } as ResetPasswordAPIReturn
    } catch (error) {
        errorToLogMessage(error, "RESET_PASSWORD_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "RESET_PASSWORD_ERROR",
            "An error occurred while resetting the password."
        )

        return {
            success: false,
            error: errors,
            redirect: false,
            redirectURL: null,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers, status: statusCode }
                )
            },
        }
    }
}
