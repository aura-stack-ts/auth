import { signIn } from "@/api/signIn.ts"
import { signOut } from "@/api/signOut.ts"
import { getSession } from "@/api/getSession.ts"
import { updateSession } from "./updateSession.ts"
import { validateRedirectTo } from "@/shared/utils.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    SessionResponse,
    SignInAPIOptions,
    SignInReturn,
    SignOutAPIOptions,
    UpdateSessionAPIOptions,
} from "@/@types/index.ts"
import { UserIdentityType } from "@/shared/identity.ts"

export const createAuthAPI = <DefaultUser extends UserIdentityType = UserIdentityType>(ctx: GlobalContext) => {
    return {
        getSession: async (options: GetSessionAPIOptions): Promise<SessionResponse<DefaultUser>> => {
            const session = await getSession<DefaultUser>({ ctx, headers: options.headers })
            return session
        },
        signIn: async <Redirect extends boolean = true>(
            oauth: LiteralUnion<BuiltInOAuthProvider>,
            options?: SignInAPIOptions<Redirect>
        ): Promise<SignInReturn<Redirect>> => {
            return signIn<Redirect>(oauth, {
                ctx,
                headers: options?.headers,
                request: options?.request,
                redirect: options?.redirect,
                redirectTo: options?.redirectTo,
            })
        },
        signOut: async (options: SignOutAPIOptions) => {
            const redirectTo = validateRedirectTo(options?.redirectTo ?? "/")
            return signOut({ ctx, headers: options.headers, redirectTo, skipCSRFCheck: true })
        },
        updateSession: async (options: UpdateSessionAPIOptions<DefaultUser>) => {
            return updateSession<DefaultUser>({
                ctx,
                headers: options.headers,
                session: options.session,
                skipCSRFCheck: options.skipCSRFCheck,
            })
        },
    }
}
