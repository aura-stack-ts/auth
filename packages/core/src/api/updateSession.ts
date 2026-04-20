import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { isAuthErrorWithCode } from "@/shared/errors.ts"
import { createRedirectTo, getBaseURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/index.ts"

export const updateSession = async <DefaultUser extends User = User>({
    ctx,
    request: requestInit,
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
                const url = `${origin}${ctx.basePath}/updateSession`
                request = new Request(url, { headers: newHeaders })
            }
            redirectURL = await createRedirectTo(request, redirectToInit, ctx)
        }

        return {
            headers: newHeaders,
            session,
            success: !!session,
            redirectURL,
            toResponse: () => {
                return Response.json(
                    { success: !!session, session, redirectURL },
                    { headers: newHeaders, status: session ? 200 : 401 }
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
            success: false,
            headers,
            session: null,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json(
                    { success: false, session: null, redirectURL: null, error: { code, message } },
                    { status: 400, headers }
                )
            },
        }
    }
}
