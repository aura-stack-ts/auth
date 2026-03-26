import { FunctionAPIContext, UpdateSessionAPIOptions, UpdateSessionReturn, User } from "@/@types/session.ts"

export const updateSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
    session: sessionInit,
    skipCSRFCheck = false,
}: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>): Promise<UpdateSessionReturn<DefaultUser>> => {
    const { session, headers } = await ctx.sessionStrategy.refreshSession(new Headers(headersInit), sessionInit, skipCSRFCheck)
    return {
        session,
        headers,
        updated: session !== null,
    } as UpdateSessionReturn<DefaultUser>
}
