import { getErrorName } from "@/utils.ts"
import type { FunctionAPIContext, GetSessionAPIOptions, SessionResponse } from "@/@types/index.ts"

export const getSession = async ({ ctx, headers }: FunctionAPIContext<GetSessionAPIOptions>): Promise<SessionResponse> => {
    try {
        const session = await ctx.session.getSession(new Headers(headers))
        if (!session) throw new Error("No session found")
        return {
            session,
            authenticated: true,
        }
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return { session: null, authenticated: false }
    }
}
