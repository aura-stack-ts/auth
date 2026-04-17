import { HeadersBuilder } from "@aura-stack/router"
import { createRedirectTo, getBaseURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, SignOutAPIOptions, SignOutAPIReturn } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    request: requestInit,
    headers: headersInit,
    redirectTo,
    skipCSRFCheck = false,
}: FunctionAPIContext<SignOutAPIOptions>): Promise<SignOutAPIReturn> => {
    const headers = await ctx.sessionStrategy.destroySession(new Headers(headersInit), skipCSRFCheck)

    let request = requestInit
    if (!request) {
        const origin = await getBaseURL({ ctx, headers })
        const url = `${origin}${ctx.basePath}/signOut`
        request = new Request(url, { headers })
    }
    const redirectToURL = await createRedirectTo(request, redirectTo, ctx)

    const headersBuilder = new HeadersBuilder(headers)
    if (redirectToURL) headersBuilder.setHeader("Location", redirectToURL)

    const headersList = headersBuilder.toHeaders()

    return {
        headers: headersList,
        redirectURL: redirectToURL,
        success: true,
        toResponse: () => {
            return Response.json(
                { success: true, redirectURL: redirectToURL },
                { headers: headersList, status: redirectTo ? 302 : 202 }
            )
        },
    }
}
