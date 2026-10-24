import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyEmailAPIOptions, VerifyEmailAPIReturn } from "@/@types/api.ts"
import { HeadersBuilder } from "@aura-stack/router"

export const verifyEmail = async (
    token: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
    }: FunctionAPIContext<VerifyEmailAPIOptions>
): Promise<VerifyEmailAPIReturn> => {
    const { logger, sessionStrategy } = ctx
    try {
        logger?.log("VERIFY_EMAIL_INITIATED")
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/verifyEmail")
            .verifyRateLimit("verifyEmail")
            .execute()
        if (rateLimit) {
            return rateLimit as VerifyEmailAPIReturn
        }

        const verified = await sessionStrategy.verifyEmail(token)

        if (!verified.success) {
            return {
                success: false,
                verified: false,
                redirect: false,
                redirectURL: null,
                error: {
                    code: "INVALID_VERIFICATION_TOKEN",
                    message: "Invalid or expired verification token",
                },
                headers: new Headers(secureApiHeaders),
                toResponse: () => {
                    return Response.json(
                        {
                            success: false,
                        },
                        { headers: secureApiHeaders, status: 400 }
                    )
                },
            }
        }

        const builder = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, builder)

        return {
            success: true,
            verified: true,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers: builder.toHeaders(),
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        verified: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: builder.toHeaders(), status: redirect ? 302 : 200 }
                )
            },
        } as VerifyEmailAPIReturn
    } catch (error) {
        errorToLogMessage(error, "VERIFY_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(error, "VERIFY_EMAIL_ERROR", "An error occurred while verifying the email.")

        return {
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: errors,
            headers: new Headers(secureApiHeaders),
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        verified: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: secureApiHeaders, status: statusCode }
                )
            },
        }
    }
}
