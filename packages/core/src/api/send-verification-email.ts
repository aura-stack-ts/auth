import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
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
    }: FunctionAPIContext<SendVerificationEmailAPIOptions>
): Promise<SendVerificationEmailAPIReturn> => {
    const { logger, sessionStrategy, emailVerification } = ctx
    try {
        logger?.log("SEND_VERIFICATION_EMAIL_INITIATED")
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/sendVerificationEmail")
            .verifyRateLimit("sendVerificationEmail")
            .execute()
        if (rateLimit) {
            return rateLimit as SendVerificationEmailAPIReturn
        }
        const { token, url } = await sessionStrategy.sendVerificationEmail(email, request)
        await emailVerification?.sendVerificationEmail?.({ email, token, url })

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
