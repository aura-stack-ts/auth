import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ForgotPasswordAPIOptions, ForgotPasswordAPIReturn } from "@/@types/api.ts"

export const forgotPassword = async (
    email: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
    }: FunctionAPIContext<ForgotPasswordAPIOptions>
): Promise<ForgotPasswordAPIReturn> => {
    const { logger, session, passwordReset } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("FORGOT_PASSWORD_INITIATED")
        const { request, rateLimit, origin } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/password/forgot")
            .verifyRateLimit("forgotPassword")
            .execute()
        if (rateLimit) {
            return rateLimit as ForgotPasswordAPIReturn
        }
        const { token, url } = await session.strategy.forgotPassword({ email, origin })
        await passwordReset?.sendPasswordResetEmail?.({ email, token, url })

        const { redirect, redirectURL, status } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)

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
        } as ForgotPasswordAPIReturn
    } catch (error) {
        errorToLogMessage(error, "FORGOT_PASSWORD_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "FORGOT_PASSWORD_ERROR",
            "An error occurred while processing the forgot password request."
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
