import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    request: requestInit,
    headers: headersInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    const initHeaders = getInitialHeaders(requestInit, headersInit)
    try {
        ctx.logger?.log("SIGN_OUT_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, session } = await createValidation(ctx, initHeaders)
            .buildRequest(requestInit, "/signOut")
            .verifyRateLimit("signOut")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const { headers } = await ctx.session.strategy.destroySession({
            sessionByToken: session!,
            headers: initHeaders,
        })

        const { redirect: shouldRedirectServer, redirectURL } = await resolveApiRedirect(
            ctx,
            request,
            redirect,
            redirectTo,
            headers
        )

        return {
            success: true,
            headers,
            redirect: shouldRedirectServer,
            redirectURL: redirect ? null : redirectURL,
            toResponse: () => {
                return Response.json(
                    { success: true, redirect: shouldRedirectServer, redirectURL: shouldRedirectServer ? null : redirectURL },
                    { headers, status: shouldRedirectServer ? 302 : 202 }
                )
            },
        } as SignOutAPIReturn
    } catch (error) {
        errorToLogMessage(error, "SIGN_OUT_FAILED", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "SIGN_OUT_FAILED", "Failed to sign-out session")
        return {
            success: false,
            headers: initHeaders,
            redirect: false,
            redirectURL: null,
            error: errors,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: initHeaders, status: statusCode }
                )
            },
        }
    }
}
