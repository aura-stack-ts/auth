import { HeadersBuilder } from "@aura-stack/router"
import type { FunctionAPIContext, SignOutAPIOptions } from "@/@types/index.ts"

export const signOut = async ({
    ctx,
    headers: headersInit,
    redirectTo = "/",
    skipCSRFCheck = false,
}: FunctionAPIContext<SignOutAPIOptions>) => {
    const headers = await ctx.sessionStrategy.destroySession(new Headers(headersInit), skipCSRFCheck)

    const headersList = new HeadersBuilder(headers).setHeader("Location", redirectTo).toHeaders()
    return Response.json(
        { redirect: Boolean(redirectTo), url: redirectTo },
        {
            status: 202,
            headers: headersList,
        }
    )
}
