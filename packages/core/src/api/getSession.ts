import { getErrorName } from "@/shared/utils.ts"
import type { FunctionAPIContext, GetSessionAPIOptions, SessionReturn, User } from "@/@types/index.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { expiredCookieAttributes } from "@/cookie.ts"

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<SessionReturn<DefaultUser>> => {
    const headers = new HeadersBuilder(secureApiHeaders)
        .setCookie(ctx.cookies.sessionToken.name, "", { ...ctx.cookies.sessionToken.attributes, ...expiredCookieAttributes })
        .setCookie(ctx.cookies.csrfToken.name, "", { ...ctx.cookies.csrfToken.attributes, ...expiredCookieAttributes })
        .toHeaders()
    const unauthorized: SessionReturn<DefaultUser> = {
        session: null,
        headers: new Headers(),
        success: false,
        toResponse: () => Response.json({ success: false, session: null }, { status: 401, headers }),
    }
    try {
        const { session, headers } = await ctx.sessionStrategy.getSession(new Headers(headersInit))
        if (!session) return unauthorized
        const newHeaders = new Headers(secureApiHeaders)
        headers.forEach((value, key) => newHeaders.set(key, value))
        return {
            session,
            headers: newHeaders,
            success: true,
            toResponse: () => Response.json({ success: true, session }, { headers: newHeaders }),
        } as SessionReturn<DefaultUser>
    } catch (error) {
        ctx?.logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        return unauthorized
    }
}
