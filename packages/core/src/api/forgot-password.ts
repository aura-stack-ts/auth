import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
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
    const { logger, sessionStrategy, passwordReset } = ctx
    try {
        logger?.log("FORGOT_PASSWORD_INITIATED")
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/password/forgot")
            .verifyRateLimit("forgotPassword")
            .execute()
        if (rateLimit) {
            return rateLimit as ForgotPasswordAPIReturn
        }
        const { token, url } = await sessionStrategy.forgotPassword(email, request)
        await passwordReset?.sendPasswordResetEmail?.({ email, token, url })

        const builder = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, builder)

        return {
            success: true,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers: builder.toHeaders(),
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: builder.toHeaders(), status: redirect ? 302 : 200 }
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
            headers: new Headers(secureApiHeaders),
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: secureApiHeaders, status: statusCode }
                )
            },
        }
    }
}
