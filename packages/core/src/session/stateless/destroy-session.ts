import { toUnionHeaders } from "@/shared/http/headers.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = (_ctx: InternalContextForStateless): SessionStrategy["destroySession"] => {
    return async ({ headers, cookieStore }) => {
        return { headers: toUnionHeaders(headers, createCookieManager(() => cookieStore).clearAll()) }
    }
}
