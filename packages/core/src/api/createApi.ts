import { signIn } from "@/api/signIn.ts"
import { signOut } from "@/api/signOut.ts"
import { validateRedirectTo } from "@/utils.ts"
import { getSession } from "@/api/getSession.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    SessionResponse,
    SignInAPIOptions,
    SignOutAPIOptions,
} from "@/@types/index.ts"

export const createAPI = (ctx: GlobalContext) => {
    return {
        getSession: async (options: GetSessionAPIOptions): Promise<SessionResponse> => {
            const session = await getSession({ ctx, headers: options.headers })
            return session
        },
        signIn: async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions) => {
            const redirectTo = validateRedirectTo(options?.redirectTo ?? "/")
            return signIn(oauth, {
                ctx,
                headers: options?.headers,
                redirect: options?.redirect,
                redirectTo,
                request: options?.request,
            })
        },
        signOut: async (options: SignOutAPIOptions) => {
            const redirectTo = validateRedirectTo(options?.redirectTo ?? "/")
            return signOut({ ctx, headers: options.headers, redirectTo, skipCSRFCheck: true })
        },
    }
}
