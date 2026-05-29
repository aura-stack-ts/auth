import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { isAuthErrorWithCode } from "@/shared/errors.ts"
import { createRedirectTo, getBaseURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/index.ts"

export const updateSession = async <DefaultUser extends User = User>({
    ctx,
    request: requestInit,
    redirect: redirectInit = true,
    headers: headersInit,
    session: sessionInit,
    redirectTo: redirectToInit,
    skipCSRFCheck = false,
}: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
    try {
        const { session, headers } = await ctx.sessionStrategy.refreshSession(
            new Headers(headersInit),
            sessionInit,
            skipCSRFCheck
        )
        const newHeaders = toUnionHeaders(headers, secureApiHeaders)

        let redirectURL: string | null = null

        if (redirectToInit) {
            let request = requestInit
            if (!request) {
                const origin = await getBaseURL({ ctx, headers })
                const url = `${origin}${ctx.basePath}/session`
                request = new Request(url, { headers: newHeaders })
            }
            redirectURL = await createRedirectTo(request, redirectToInit, ctx)
        }
        const isSuccess = !!session
        const shouldRedirectServer = isSuccess && redirectInit && !!redirectURL
        const finalRedirectFlag = isSuccess ? (shouldRedirectServer ? true : false) : false

        if (shouldRedirectServer) {
            newHeaders.set("Location", redirectURL!)
        }

        return {
            headers: newHeaders,
            session,
            success: isSuccess,
            redirect: finalRedirectFlag,
            redirectURL: shouldRedirectServer ? null : redirectURL,
            toResponse: () => {
                return Response.json(
                    {
                        success: isSuccess,
                        session,
                        redirect: finalRedirectFlag,
                        redirectURL: shouldRedirectServer ? null : redirectURL,
                    },
                    { headers: newHeaders, status: isSuccess ? (shouldRedirectServer ? 302 : 200) : 401 }
                )
            },
        } as UpdateSessionAPIReturn<DefaultUser>
    } catch (error) {
        let code = "UPDATE_SESSION_INVALID"
        let message = "Failed to update session."
        if (isAuthErrorWithCode(error)) {
            code = error.code
            message = error.message
        }

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
                    { status: 400, headers }
                )
            },
        }
    }
}
