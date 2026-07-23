import { toUnionHeaders } from "@/shared/utils.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext, UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/index.ts"

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
        console.log("double submit token:", skipCSRFCheck || Boolean(doubleSubmitToken))
        const { session, headers } = await ctx.sessionStrategy.refreshSession(
            new Headers(headersInit),
            sessionInit,
            skipCSRFCheck || Boolean(doubleSubmitToken)
        )
        if (!session) {
            throw new AuraAuthError({ code: "UPDATE_SESSION_INVALID" })
        }

        const newHeaders = toUnionHeaders(headers, secureApiHeaders)

        const { request, rateLimit } = await createValidation(ctx, newHeaders)
            .buildRequest(requestInit, "/session")
            .verifyRateLimit("updateSession")
            .execute()

        if (rateLimit) {
            return rateLimit as UpdateSessionAPIReturn<DefaultUser>
        }

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
        console.error("Error in updateSession API:", error)
        const { code, message, statusCode } = handleApiError(error, "UPDATE_SESSION_INVALID", "Failed to update session.")

        const headers = new Headers(secureApiHeaders)
        return {
            headers,
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json(
                    { success: false, session: null, redirect: false, redirectURL: null },
                    { status: statusCode, headers }
                )
            },
        }
    }
}
