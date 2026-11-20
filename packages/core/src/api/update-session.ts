import { getInitialHeaders, toUnionHeaders } from "@/shared/http/headers.ts"
import { isAuraAuthError } from "@/errors/aura-error.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    const initialHeaders = getInitialHeaders(requestInit, headersInit)
    try {
        ctx.logger?.log("UPDATE_SESSION_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, sessionToken, rawSession } = await createValidation(ctx, initialHeaders)
            .buildRequest(requestInit, "/session")
            .verifyRateLimit("updateSession")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken, false)
            .execute()

        if (rateLimit) {
            return rateLimit as UpdateSessionAPIReturn<DefaultUser>
        }

        const { session, headers } = await ctx.session.strategy.updateSession({
            session: sessionInit,
            headers: initialHeaders,
            rawSession,
            sessionToken,
        })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo: redirectToInit,
            headers: initialHeaders,
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

        const shouldClearSessionCookie =
            isAuraAuthError(error) &&
            ["SESSION_NOT_FOUND", "SESSION_INVALID", "SESSION_EXPIRED", "SESSION_REVOKED"].includes(error.code)
        const resolvedHeaders = shouldClearSessionCookie
            ? toUnionHeaders(ctx.cookies.manager.clear(), initialHeaders)
            : initialHeaders

        return {
            headers: resolvedHeaders,
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: errors,
            toResponse: () => {
                return Response.json(
                    { success: false, session: null, redirect: false, redirectURL: null },
                    { status: statusCode, headers: resolvedHeaders }
                )
            },
        }
    }
}
