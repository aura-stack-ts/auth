import { isAuraAuthError } from "@/errors/aura-error.ts"
import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getInitialHeaders, secureApiHeaders, toUnionHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    const initialHeaders = new Headers(secureApiHeaders)
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

        return {
            headers,
            session,
            success: true,
            redirect,
            redirectURL,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        session,
                        redirect,
                        redirectURL,
                    },
                    { headers, status }
                )
            },
        } as UpdateSessionAPIReturn<DefaultUser>
    } catch (error) {
        errorToLogMessage(error, "UPDATE_SESSION_INVALID", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "UPDATE_SESSION_INVALID", "Failed to update session.")
        const headers = isAuraAuthError(error) ? toUnionHeaders(initialHeaders, error.headers) : initialHeaders

        return {
            headers: headers,
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: errors,
            toResponse: () => {
                return Response.json(
                    { success: false, session: null, redirect: false, redirectURL: null },
                    { status: statusCode, headers: headers }
                )
            },
        }
    }
}
