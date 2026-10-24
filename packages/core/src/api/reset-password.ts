import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
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
}: FunctionAPIContext<ResetPasswordAPIOptions>): Promise<ResetPasswordAPIReturn> => {
    const { logger, sessionStrategy } = ctx
    try {
        logger?.log("RESET_PASSWORD_INITIATED")
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/password/reset")
            .verifyRateLimit("resetPassword")
            .execute()
        if (rateLimit) {
            return rateLimit as ResetPasswordAPIReturn
        }

        await sessionStrategy.resetPassword(payload.token, payload.newPassword)

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
