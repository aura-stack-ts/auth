import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const destroySession = ({ cookieManager }: InternalStatelessContext): SessionStrategy["destroySession"] => {
    return async () => {
        return cookieManager.clearAll()
    }
}
