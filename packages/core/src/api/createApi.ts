import { getSession, signIn, signInCredentials, signOut, updateSession } from "@/api/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    SessionReturn,
    SignInAPIOptions,
    SignInAPIReturn,
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
        ): Promise<SignInAPIReturn<Redirect>> => {
            return signIn<Redirect>(oauth, { ctx, ...options })
        },
        signInCredentials: async (options: SignInCredentialsAPIOptions) => {
            return signInCredentials({ ctx, ...options })
        },
        signOut: async (options: SignOutAPIOptions) => {
            return signOut({ ctx, skipCSRFCheck: true, ...options })
        },
        updateSession: async (options: UpdateSessionAPIOptions<DefaultUser>) => {
            return updateSession<DefaultUser>({ ctx, skipCSRFCheck: true, ...options })
        },
    }
}
