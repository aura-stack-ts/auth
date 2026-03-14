import { signOut } from "@/api/signOut.ts"
import { validateRedirectTo } from "@/utils.ts"
import { getSession } from "@/api/getSession.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { GetSessionAPIOptions, SessionResponse, SignOutAPIOptions } from "@/@types/index.ts"

export const createAPI = (ctx: GlobalContext) => {
    return {
        getSession: async (options: GetSessionAPIOptions): Promise<SessionResponse> => {
            const session = await getSession({ ctx, headers: options.headers })
            return session
        },
        signOut: async (options: SignOutAPIOptions) => {
            const redirectTo = validateRedirectTo(options.redirectTo ?? "/")
            return signOut({ ctx, headers: options.headers, redirectTo, skipCSRFCheck: true })
        },
    }
}
