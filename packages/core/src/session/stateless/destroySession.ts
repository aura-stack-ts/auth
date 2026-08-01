import { verifyCSRFToken, verifySessionToken } from "@/shared/utils.ts"
import type { InternalStatelessContext } from "@/@types/index.ts"

export const destroySession = ({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const { logger, jose, jwtManager } = ctx
    return async (headers: Headers, skipCSRFCheck: boolean = false) => {
        await verifyCSRFToken({ headers, skipCSRFCheck, cookies: cookies(), logger, jose })
        await verifySessionToken({ headers, cookies: cookies(), jwt: jwtManager, logger })
        return cookieManager.clear()
    }
}
