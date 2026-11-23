import { isSecureConnection } from "@/shared/http/is-secure-connection.ts"
import type { RouterGlobalContext } from "@/@types/internal.ts"

export const getCookieStore = ({ ctx, request }: { ctx: RouterGlobalContext<any, any>; request?: Request | Headers }) => {
    if (ctx.cookies.secureCookies === "trusted") {
        return ctx.cookies.precomputed.trusted
    }
    if (ctx.cookies.secureCookies === "untrusted") {
        return ctx.cookies.precomputed.untrusted
    }
    if (ctx.cookies.secureCookies === "dynamic" && request) {
        const isSecure = isSecureConnection(request, ctx.trustedProxyHeaders)
        return isSecure ? ctx.cookies.precomputed.trusted : ctx.cookies.precomputed.untrusted
    }
    return ctx.cookies.store
}
