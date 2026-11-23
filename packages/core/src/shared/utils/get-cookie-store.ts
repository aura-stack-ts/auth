import { isSecureConnection } from "@/shared/http/secure-connection.ts"
import type { RouterGlobalContext } from "@/@types/internal.ts"

export const getCookieStore = ({ ctx, request }: { ctx: RouterGlobalContext<any, any>; request?: Request }) => {
    if (ctx.cookies.secureCookies === "trusted") {
        return ctx.cookies.precomputed.trusted
    }
    if (ctx.cookies.secureCookies === "untrusted") {
        return ctx.cookies.precomputed.untrusted
    }
    if (request) {
        const isSecure = isSecureConnection(request, ctx.trustedProxyHeaders)
        return isSecure ? ctx.cookies.precomputed.trusted : ctx.cookies.precomputed.untrusted
    }
    return ctx.cookies.store
}
