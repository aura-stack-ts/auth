import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("VERIFY_EMAIL_INITIATED")
        const { request, rateLimit } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/verifyEmail")
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
        } as VerifyEmailAPIReturn
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(error, "VERIFY_EMAIL_ERROR", "An error occurred while verifying the email.")

        return {
            success: false,
            redirect: false,
            redirectURL: null,
            error: errors,
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
