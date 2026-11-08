import { getOptionalCookie } from "@/shared/http/cookie.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const isProviderConnected = (ctx: InternalContextForStateless): SessionStrategy["isProviderConnected"] => {
    return async ({ oauthId, headers }) => {
        try {
            const cookieName = `${ctx.cookies.store.accessToken.name}.${oauthId}`
            const token = getOptionalCookie(headers, cookieName)
            if (!token) return false
            await ctx.jose.manager.verifyToken(token)
            return true
        } catch {
            return false
        }
    }
}
