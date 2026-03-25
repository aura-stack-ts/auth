import { getErrorName } from "@/lib/utils.ts"
import type { FunctionAPIContext, GetSessionAPIOptions, SessionResponse } from "@/@types/index.ts"

const unauthorized: SessionResponse = { session: null, headers: new Headers(), authenticated: false }

export const getSession = async ({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<SessionResponse> => {
    try {
        const { session, headers } = await ctx.sessionStrategy.getSession(new Headers(headersInit))
        if (!session) return unauthorized
        return {
            session,
            headers,
            authenticated: true,
        }
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return unauthorized
    }
}
