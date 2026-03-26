import { getErrorName } from "@/shared/utils.ts"
import type { FunctionAPIContext, GetSessionAPIOptions, SessionResponse, User } from "@/@types/index.ts"

const unauthorized: SessionResponse = { session: null, headers: new Headers(), authenticated: false }

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<SessionResponse<DefaultUser>> => {
    try {
        const { session, headers } = await ctx.sessionStrategy.getSession(new Headers(headersInit))
        if (!session) return unauthorized
        return {
            session,
            headers,
            authenticated: true,
        } as SessionResponse<DefaultUser>
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return unauthorized
    }
}
