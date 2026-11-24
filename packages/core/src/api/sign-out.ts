import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    request: requestInit,
    headers: headersInit,
    redirect: redirectInit = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        ctx.logger?.log("SIGN_OUT_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, rawSession, cookieStore } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/signOut")
            .verifyRateLimit("signOut")
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const { headers } = await ctx.session.strategy.destroySession({
            rawSession,
            cookieStore,
            headers: initHeaders,
        })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
            status: 202,
        })

        return toAPIResponse<SignOutAPIReturn>({
            success: true,
            headers,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "SIGN_OUT_FAILED", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "SIGN_OUT_FAILED", "Failed to sign-out session")
        const headers = getAuraAuthHeaders(error, initHeaders)
        return toAPIResponse<SignOutAPIReturn>({
            success: false,
            headers,
            redirect: false,
            redirectURL: null,
            silent: { error: errors },
            status: statusCode,
        })
    }
}
