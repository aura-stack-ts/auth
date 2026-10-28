//import { HeadersBuilder } from "@aura-stack/router"
//import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
//import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
//import type { FunctionAPIContext } from "@/@types/internal.ts"
//import type { CancelEmailChangeAPIOptions, CancelEmailChangeAPIReturn } from "@/@types/api.ts"
//
//export const cancelEmailChange = async ({
//    ctx,
//    payload,
//    headers: headersInit,
//    request: requestInit,
//    redirectTo,
//    redirect: redirectInit = true,
//    skipCSRFCheck = false,
//    doubleSubmitToken = undefined,
//}: FunctionAPIContext<CancelEmailChangeAPIOptions>): Promise<CancelEmailChangeAPIReturn> => {
//    const { logger, sessionStrategy } = ctx
//    try {
//        logger?.log("CANCEL_EMAIL_CHANGE_INITIATED")
//
//        const validation = createValidation(ctx, toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {}))
//            .buildRequest(requestInit, "/email/change/cancel")
//            .verifyRateLimit("cancelEmailChange")
//
//        const isAutomaticRequest = Boolean(payload?.token)
//
//        if (!isAutomaticRequest) {
//            validation.verifyCSRFToken(skipCSRFCheck, doubleSubmitToken).verifySession().execute()
//        } else {
//            validation.execute()
//        }
//
//        //if (rateLimit) {
//        //    return rateLimit
//        //}
//
//        //const headers = new HeadersBuilder(secureApiHeaders)
//        //const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)
//        //const headersList = headers.toHeaders()
//        return {
//            success: true,
//        } as CancelEmailChangeAPIReturn
//    } catch (error) {
//        errorToLogMessage(error, "CANCEL_EMAIL_CHANGE_ERROR", logger)
//        const { errors, statusCode } = handleApiError(
//            error,
//            "CANCEL_EMAIL_CHANGE_ERROR",
//            "An error occurred while canceling the email change."
//        )
//        return {
//            success: false,
//            error: errors,
//            redirect: false,
//            redirectURL: null,
//            headers: new Headers(secureApiHeaders),
//            toResponse: () => {
//                return Response.json(
//                    {
//                        success: false,
//                        redirect: false,
//                        redirectURL: null,
//                    },
//                    { headers: secureApiHeaders, status: statusCode }
//                )
//            },
//        }
//    }
//}
//
