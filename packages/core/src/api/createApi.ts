import { getSession, signIn, signInCredentials, signOut, updateSession } from "@/api/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    GetSessionAPIReturn,
    SignInAPIOptions,
    SignInAPIReturn,
    SignOutAPIOptions,
    UpdateSessionAPIOptions,
    User,
    SignInCredentialsAPIOptions,
    SignInCredentialsAPIReturn,
    SignOutAPIReturn,
    UpdateSessionAPIReturn,
} from "@/@types/index.ts"

export const createAuthAPI = <DefaultUser extends User = User>(ctx: GlobalContext) => {
    return {
        getSession: async (options: GetSessionAPIOptions): Promise<GetSessionAPIReturn<DefaultUser>> => {
            const session = await getSession<DefaultUser>({ ctx, headers: options.headers })
            return session
        },
        signIn: async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions): Promise<SignInAPIReturn> => {
            return signIn(oauth, { ctx, ...options })
        },
        signInCredentials: async (options: SignInCredentialsAPIOptions): Promise<SignInCredentialsAPIReturn> => {
            return signInCredentials({ ctx, ...options })
        },
        signOut: async (options: SignOutAPIOptions): Promise<SignOutAPIReturn> => {
            return signOut({ ctx, ...options, skipCSRFCheck: true })
        },
        updateSession: async (options: UpdateSessionAPIOptions<DefaultUser>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
            return updateSession<DefaultUser>({ ctx, ...options, skipCSRFCheck: true })
        },
    }
}
