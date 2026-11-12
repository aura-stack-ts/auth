import { toUnionHeaders } from "@/shared/http/headers.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = (ctx: InternalContextForStateless): SessionStrategy["destroySession"] => {
    return async ({ headers }) => {
        return { headers: toUnionHeaders(headers, ctx.cookies.manager.clearAll()) }
    }
}
