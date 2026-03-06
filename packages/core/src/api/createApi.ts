import { signOut } from "@/api/signOut.ts"
import { getSession } from "@/api/getSession.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { SessionResponse } from "@/@types/index.ts"
import { validateRedirectTo } from "@/utils.ts"

export interface APIOptions {
    headers: HeadersInit
    redirectTo?: string
}

export const createAPI = (ctx: GlobalContext) => {
    return {
        getSession: async ({ headers }: { headers: HeadersInit }): Promise<SessionResponse> => {
            const session = await getSession({ ctx: ctx as GlobalContext, headers })
            return session
        },
        signOut: async (options: APIOptions) => {
            const redirectTo = validateRedirectTo(options.redirectTo ?? "/")
            return signOut({ ctx: ctx as GlobalContext, headers: options.headers, redirectTo, skipCSRFCheck: true })
        },
        signIn: async () => {
            return Response.redirect("/sign-in", 302)
        },
    }
}
