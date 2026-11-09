import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = (ctx: InternalContextForStateless): SessionStrategy["destroySession"] => {
    return async () => {
        return ctx.cookies.manager.clearAll()
    }
}
