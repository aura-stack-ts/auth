import { secureApiHeaders } from "@/shared/headers.ts"
import { toUnionHeaders } from "@/shared/utils.ts"
import type { FunctionAPIContext, UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/session.ts"

export const updateSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
    session: sessionInit,
    skipCSRFCheck = false,
}: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
    const { session, headers } = await ctx.sessionStrategy.refreshSession(new Headers(headersInit), sessionInit, skipCSRFCheck)
    const newHeaders = toUnionHeaders(headers, secureApiHeaders)
    return {
        headers: newHeaders,
        session,
        success: !!session,
        toResponse: () => {
            return Response.json({ success: !!session, session }, { headers: newHeaders, status: session ? 200 : 401 })
        },
    } as UpdateSessionAPIReturn<DefaultUser>
}
