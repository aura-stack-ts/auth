import { HeadersBuilder } from "@aura-stack/router"
import { isAuraAuthError } from "@/shared/unstable_error.ts"
import { createRedirectTo, getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    request: requestInit,
    headers: headersInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
}: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    const headers = await ctx.sessionStrategy.destroySession(new Headers(headersInit), skipCSRFCheck)
    try {
        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers })
            const url = `${origin}${ctx.basePath}/signOut`
            request = new Request(url, { headers })
        }
        await getOriginURL(request, ctx)

        const headersBuilder = new HeadersBuilder(headers)
        let redirectURL: string | null = await createRedirectTo(request, redirectTo, ctx)
        redirectURL = redirectTo ? redirectURL : redirectURL === "/" ? null : redirectURL

        if (redirect && redirectURL) {
            headersBuilder.setHeader("Location", redirectURL)
        }

        const headersList = headersBuilder.toHeaders()
        const shouldRedirectServer = redirect && !!redirectURL
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
        let code = "SIGN_OUT_FAILED"
        let message = "Failed to sign-out session"
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
        }
        return {
            success: false,
            headers,
            redirect: false,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectsURL: null,
                    },
                    { headers, status: 400 }
                )
            },
        }
    }
}
