import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailChangeAPIOptions, VerifyEmailChangeAPIReturn } from "@/@types/api.ts"

export const verifyEmailChange = async ({
    payload,
    ctx,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<VerifyEmailChangeAPIOptions>): Promise<VerifyEmailChangeAPIReturn> => {
    const { logger, session } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("VERIFY_EMAIL_CHANGE_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })
        const { request, rateLimit, userId, sessionId } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/email/change/verify")
            .verifyRateLimit("verifyEmailChange")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        await session.strategy.verifyEmailChange({
            sessionId: sessionId!,
            userId: userId!,
            token: payload.token,
        })

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
        } as VerifyEmailChangeAPIReturn
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_CHANGE_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "VERIFY_EMAIL_CHANGE_ERROR",
            "An error occurred while verifying the email change."
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
