import { FunctionAPIContext, UpdateSessionAPIOptions } from "@/@types/session.ts"

export const updateSession = async ({
    ctx,
    headers: headersInit,
    session: sessionInit,
}: FunctionAPIContext<UpdateSessionAPIOptions>) => {
    const { session, headers } = await ctx.sessionStrategy.refreshSession(new Headers(headersInit), sessionInit)
    return {
        session,
        headers,
    }
}
