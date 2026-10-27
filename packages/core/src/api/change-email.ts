import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
}: FunctionAPIContext<ChangeEmailAPIOptions>): Promise<ChangeEmailAPIReturn> => {
    const { logger, sessionStrategy, emailChange } = ctx
    try {
        logger?.log("CHANGE_EMAIL_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })
        const { request, rateLimit, userId } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/email/change")
            .verifyRateLimit("changeEmail")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        const { token, url, oldEmail } = await sessionStrategy.changeEmail(
            userId!,
            payload.currentPassword,
            payload.newEmail,
            request
        )
        await emailChange?.sendEmailChangeVerification?.({ email: oldEmail, newEmail: payload.newEmail, token, url })

        const headers = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)
        const headersList = headers.toHeaders()

        return {
            success: true,
            redirect,
            redirectURL: redirectInit ? null : redirectURL,
            headers: headersList,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: headersList, status: redirect ? 302 : 200 }
                )
            },
        } as ChangeEmailAPIReturn
    } catch (error) {
        errorToLogMessage(error, "CHANGE_EMAIL_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CHANGE_EMAIL_ERROR",
            "An error occurred while changing the email address."
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
