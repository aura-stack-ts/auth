import { toUnionHeaders } from "@/shared/utils.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import {
    createValidation,
    errorToLogMessage,
    handleApiError,
    resolveApiRedirect,
    toStandardizedHeaders,
} from "@/shared/utils/api.ts"
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
}: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
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
            headers: validatedHeaders,
        } = await createValidation(ctx, toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {}))
            .buildRequest(requestInit, "/session")
            .verifyRateLimit("updateSession")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken, false)
            .execute()

        if (rateLimit) {
            return rateLimit as UpdateSessionAPIReturn<DefaultUser>
        }

        const { session, headers } = await ctx.sessionStrategy.refreshSession(validatedHeaders, sessionInit)
        if (!session) {
            throw new AuraAuthError({ code: "UPDATE_SESSION_INVALID" })
        }

        const newHeaders = toUnionHeaders(headers, secureApiHeaders)

        const { redirect: shouldRedirectServer, redirectURL } = await resolveApiRedirect(
            ctx,
            request,
            redirectInit,
            redirectToInit,
            newHeaders
        )

        return {
            headers: newHeaders,
            session,
            success: true,
            redirect: shouldRedirectServer,
            redirectURL: shouldRedirectServer ? null : redirectURL,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        session,
                        redirect: shouldRedirectServer,
                        redirectURL: shouldRedirectServer ? null : redirectURL,
                    },
                    { headers: newHeaders, status: shouldRedirectServer ? 302 : 200 }
                )
            },
        } as UpdateSessionAPIReturn<DefaultUser>
    } catch (error) {
        errorToLogMessage(error, "UPDATE_SESSION_INVALID", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "UPDATE_SESSION_INVALID", "Failed to update session.")

        const headers = new Headers(secureApiHeaders)
        return {
            headers,
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: errors,
            toResponse: () => {
                return Response.json(
                    { success: false, session: null, redirect: false, redirectURL: null },
                    { status: statusCode, headers }
                )
            },
        }
    }
}
