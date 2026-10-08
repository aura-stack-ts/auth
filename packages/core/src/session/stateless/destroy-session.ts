import type { InternalStatelessContext } from "@/@types/internal.ts"

export const destroySession = ({ cookieManager }: InternalStatelessContext) => {
    return async (_headers: Headers) => {
        return cookieManager.clearAll()
    }
}
