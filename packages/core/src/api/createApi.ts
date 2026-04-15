import { validateRedirectTo } from "@/shared/utils.ts"
import { getSession, signIn, signInCredentials, signOut, updateSession } from "@/api/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    SessionReturn,
    SignInAPIOptions,
    SignInReturn,
    SignOutAPIOptions,
    UpdateSessionAPIOptions,
    User,
    SignInCredentialsAPIOptions,
} from "@/@types/index.ts"

export const createAuthAPI = <DefaultUser extends User = User>(ctx: GlobalContext) => {
    return {
        getSession: async (options: GetSessionAPIOptions): Promise<SessionReturn<DefaultUser>> => {
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
        signInCredentials: async (options: SignInCredentialsAPIOptions) => {
            return signInCredentials({
                ctx,
                payload: options.payload,
                redirectTo: options.redirectTo,
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
