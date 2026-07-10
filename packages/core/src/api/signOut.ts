import { HeadersBuilder } from "@aura-stack/router"
import type { FunctionAPIContext, SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"
import { createValidation, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"

export const signOut = async ({
    ctx,
    request: requestInit,
    headers: headersInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
}: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    let responseHeaders = new Headers(headersInit)
    try {
        responseHeaders = await ctx.sessionStrategy.destroySession(responseHeaders, skipCSRFCheck)
        const { request } = await createValidation(ctx, responseHeaders).buildRequest(requestInit, "/signOut").execute()

        const headersBuilder = new HeadersBuilder(responseHeaders)
        const { redirect: shouldRedirectServer, redirectURL } = await resolveApiRedirect(
            ctx,
            request,
            redirect,
            redirectTo,
            headersBuilder
        )

        const headersList = headersBuilder.toHeaders()
        return {
            success: true,
            headers: headersList,
            redirect: shouldRedirectServer,
            redirectURL: redirect ? null : redirectURL,
            toResponse: () => {
                return Response.json(
                    { success: true, redirect: shouldRedirectServer, redirectURL: shouldRedirectServer ? null : redirectURL },
                    { headers: headersList, status: shouldRedirectServer ? 302 : 202 }
                )
            },
        } as SignOutAPIReturn
    } catch (error) {
        const { code, message, statusCode } = handleApiError(error, "SIGN_OUT_FAILED", "Failed to sign-out session")
        return {
            success: false,
            headers: responseHeaders,
            redirect: false,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: responseHeaders, status: statusCode }
                )
            },
        }
    }
}
