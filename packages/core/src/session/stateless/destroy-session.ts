import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = ({ ctx }: InternalStatelessContext): SessionStrategy["destroySession"] => {
    return async () => {
        return ctx.cookies.manager.clearAll()
    }
}
