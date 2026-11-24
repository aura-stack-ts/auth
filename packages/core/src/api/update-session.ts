import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/index.ts"

export const updateSession = async <DefaultUser extends User = User>({
    ctx,
    request: requestInit,
    redirect: redirectInit = true,
    headers: headersInit,
    session: sessionInit,
    redirectTo: redirectToInit,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
    const initHeaders = new Headers(secureApiHeaders)

    let cookieStore = getCookieStore({ ctx, request: requestInit ?? getInitialHeaders(undefined, headersInit) })
    try {
        ctx.logger?.log("UPDATE_SESSION_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })
        const {
            request,
            rateLimit,
            sessionToken,
            rawSession,
            cookieStore: resolvedCookieStore,
        } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/session")
            .verifyRateLimit("updateSession")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken, false)
            .execute()

        if (rateLimit) {
            return rateLimit as UpdateSessionAPIReturn<DefaultUser>
        }
        cookieStore = resolvedCookieStore

        const { session, headers } = await ctx.session.strategy.updateSession({
            session: sessionInit,
            rawSession,
            sessionToken,
            cookieStore,
        })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            headers,
            redirectInit,
            redirectTo: redirectToInit,
            fallbackRedirectTo,
        })

        return toAPIResponse<UpdateSessionAPIReturn<DefaultUser>>({
            headers,
            session,
            success: true,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "UPDATE_SESSION_INVALID", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "UPDATE_SESSION_INVALID", "Failed to update session.")
        const outHeaders = getAuraAuthHeaders(error, initHeaders)

        return toAPIResponse<UpdateSessionAPIReturn<DefaultUser>>({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            silent: { error: errors },
            status: statusCode,
        })
    }
}
