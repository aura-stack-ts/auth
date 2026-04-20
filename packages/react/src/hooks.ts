import { use, useCallback, useRef } from "react"
import { AuthContext } from "@/context.tsx"
import type {
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInOptions,
    SignOutOptions,
    User,
    SignInCredentialsOptions,
    UpdateSessionOptions,
} from "@aura-stack/auth/types"
import type { AuthReactContextValue } from "@/@types/types.ts"

export const useAuth = <DefaultUser extends User = User>(): AuthReactContextValue<DefaultUser> => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider.")
    }
    return ctx as AuthReactContextValue<DefaultUser>
}

export const useSession = <DefaultUser extends User = User>() => {
    const { session, status } = useAuth<DefaultUser>()
    return { session, status }
}

/**
 * OAuth sign-in. Pass default {@link SignInOptions} once; each call can still override
 * `redirect`, `redirectTo`, etc. Call-time options win on conflict.
 */
export const useSignIn = <DefaultUser extends User = User>(defaultOptions?: SignInOptions) => {
    const { signIn } = useAuth<DefaultUser>()
    const defaultsRef = useRef(defaultOptions)
    defaultsRef.current = defaultOptions
    return useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>, signInOptions?: SignInOptions) =>
            signIn(oauth, { ...defaultsRef.current, ...signInOptions }),
        [signIn]
    )
}

/**
 * Credentials sign-in. Default {@link SignInOptions} are merged with per-invocation options.
 */
export const useSignInCredentials = <DefaultUser extends User = User>(defaultOptions?: SignInOptions) => {
    const { signInCredentials } = useAuth<DefaultUser>()
    const defaultsRef = useRef(defaultOptions)
    defaultsRef.current = defaultOptions
    return useCallback(
        (options: SignInCredentialsOptions) => signInCredentials({ ...defaultsRef.current, ...options }),
        [signInCredentials]
    )
}

/**
 * Sign-out. Default {@link SignOutOptions} (`redirect`, `redirectTo`, …) merge with each call.
 */
export const useSignOut = <DefaultUser extends User = User>(defaultOptions?: SignOutOptions) => {
    const { signOut } = useAuth<DefaultUser>()
    const defaultsRef = useRef(defaultOptions)
    defaultsRef.current = defaultOptions
    return useCallback((signOutOptions?: SignOutOptions) => signOut({ ...defaultsRef.current, ...signOutOptions }), [signOut])
}

/**
 * Patch session user/expiry. Default  merge per call
 * (e.g. `skipRefresh` to avoid a follow-up `getSession`).
 */
export const useUpdateSession = <DefaultUser extends User = User>(defaultOptions?: UpdateSessionOptions<DefaultUser>) => {
    const { updateSession } = useAuth<DefaultUser>()
    const defaultsRef = useRef(defaultOptions)
    defaultsRef.current = defaultOptions
    return useCallback(
        (options: UpdateSessionOptions<DefaultUser>) => updateSession({ ...defaultsRef.current, ...options }),
        [updateSession]
    )
}
