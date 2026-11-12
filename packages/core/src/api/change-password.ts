import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ChangePasswordAPIOptions, ChangePasswordAPIReturn } from "@/@types/api.ts"

export const changePassword = async ({
    payload,
    ctx,
    headers: headersInit,
    request: requestInit,
    redirectTo,
    redirect: redirectInit = true,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<ChangePasswordAPIOptions>): Promise<ChangePasswordAPIReturn> => {
    const { logger, session } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("CHANGE_PASSWORD_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, userId } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/password/change")
            .verifyRateLimit("changePassword")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        await session.strategy.changePassword({
            userId: userId!,
            currentPassword: payload.currentPassword,
            newPassword: payload.newPassword,
        })

        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)

        return {
            success: true,
            redirect,
            redirectURL: redirectInit ? null : redirectURL,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers, status: redirect ? 302 : 200 }
                )
            },
        } as ChangePasswordAPIReturn
    } catch (error) {
        errorToLogMessage(error, "CHANGE_PASSWORD_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CHANGE_PASSWORD_ERROR",
            "An error occurred while changing the password."
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
