import { getErrorName, toUnionHeaders } from "@/shared/utils.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { expiredCookieAttributes } from "@/cookie.ts"
import type { User } from "@/@types/session.ts"
import type { FunctionAPIContext, GetSessionAPIOptions, GetSessionAPIReturn } from "@/@types/api.ts"

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<GetSessionAPIReturn<DefaultUser>> => {
    const headers = new HeadersBuilder(secureApiHeaders)
        .setCookie(ctx.cookies.sessionToken.name, "", { ...ctx.cookies.sessionToken.attributes, ...expiredCookieAttributes })
        .setCookie(ctx.cookies.csrfToken.name, "", { ...ctx.cookies.csrfToken.attributes, ...expiredCookieAttributes })
        .toHeaders()
    const unauthorized: GetSessionAPIReturn<DefaultUser> = {
        session: null,
        headers,
        success: false,
        error: {
            code: "GET_SESSION_FAILED",
            message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
        },
        toResponse: () => Response.json({ success: false, session: null }, { status: 401, headers }),
    }
    try {
        const { session, headers } = await ctx.sessionStrategy.getSession(new Headers(headersInit))
        if (!session) return unauthorized
        const newHeaders = toUnionHeaders(headers, secureApiHeaders)
        return {
            session,
            headers: newHeaders,
            success: true,
            toResponse: () => Response.json({ success: true, session }, { headers: newHeaders }),
        } as GetSessionAPIReturn<DefaultUser>
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return unauthorized
    }
}
