import { FunctionAPIContext, UpdateSessionAPIOptions } from "@/@types/session.ts"

export const updateSession = async ({
    ctx,
    headers: headersInit,
    session: sessionInit,
    skipCSRFCheck = false,
}: FunctionAPIContext<UpdateSessionAPIOptions>) => {
    const { session, headers } = await ctx.sessionStrategy.refreshSession(new Headers(headersInit), sessionInit, skipCSRFCheck)
    return {
        session,
        headers,
        updated: session !== null,
    }
}
