import { AuraAuthError } from "@/errors/aura-error.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SendVerificationEmailAPIOptions, SendVerificationEmailAPIReturn } from "@/@types/api.ts"

export const sendVerificationEmail = async (
    email: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
        fallbackRedirectTo = undefined,
    }: FunctionAPIContext<SendVerificationEmailAPIOptions>
): Promise<SendVerificationEmailAPIReturn> => {
    const { logger, session, emailVerification } = ctx
    if (!emailVerification?.sendVerificationEmail) {
        throw new AuraAuthError({ code: "SEND_VERIFICATION_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("SEND_VERIFICATION_EMAIL_INITIATED")
        const { request, rateLimit, origin } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/sendVerificationEmail")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .verifyRateLimit("sendVerificationEmail")
            .execute()
        if (rateLimit) {
            return rateLimit as SendVerificationEmailAPIReturn
        }
        const { token, url } = await session.strategy.sendVerificationEmail({
            email,
            origin,
        })
        await emailVerification.sendVerificationEmail({ email, token, url })

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
        } as SendVerificationEmailAPIReturn
    } catch (error) {
        errorToLogMessage(error, "SEND_VERIFICATION_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "SEND_VERIFICATION_EMAIL_ERROR",
            "An error occurred while sending the verification email."
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
