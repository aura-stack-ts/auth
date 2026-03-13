import { signOut } from "@/api/signOut.ts"
import { validateRedirectTo } from "@/utils.ts"
import { getSession } from "@/api/getSession.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { SessionResponse } from "@/@types/index.ts"

export interface APIOptions {
    headers: HeadersInit
    redirectTo?: string
}

export const createAPI = (ctx: GlobalContext) => {
    return {
        getSession: async ({ headers }: { headers: HeadersInit }): Promise<SessionResponse> => {
            const session = await getSession({ ctx, headers })
            return session
        },
        signOut: async (options: APIOptions) => {
            const redirectTo = validateRedirectTo(options.redirectTo ?? "/")
            return signOut({ ctx, headers: options.headers, redirectTo, skipCSRFCheck: true })
        },
    }
}
