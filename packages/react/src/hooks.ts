"use client"
import { User } from "@aura-stack/auth"
import { use, useCallback, useTransition } from "react"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    SignInCredentialsOptions,
    SignInCredentialsReturn,
    SignInOptions,
    SignInReturn,
    SignOutOptions,
    SignOutReturn,
    UpdateSessionOptions,
    UpdateSessionReturn,
} from "@aura-stack/auth/types"
import { AuthContext, broadcast, Context } from "./context.tsx"

const useAssertContext = <DefaultUser extends User = User>() => {
    const ctx = use(AuthContext)
    if (ctx === undefined) {
        throw new Error("useAuth must be used within an <AuthProvider>.")
    }
    return ctx as Context<DefaultUser>
}

export const useSession = <DefaultUser extends User = User>() => {
    const { session, status } = useAssertContext<DefaultUser>()
    return { session, status }
}

export const useSignIn = () => {
    const { client } = useAssertContext()
    const [isPending, startTransition] = useTransition()

    const signIn = useCallback(
        <Options extends SignInOptions>(
            oauth: LiteralUnion<BuiltInOAuthProvider>,
            options?: Options
        ): Promise<SignInReturn<Options>> => {
            return new Promise((resolve) => {
                startTransition(async () => {
                    const value = await client.signIn(oauth, options)
                    broadcast({ type: "session:sync" })
                    resolve(value)
                })
            })
        },
        [client]
    )

    return { signIn, isPending } as const
}

export const useSignInCredentials = () => {
    const { client } = useAssertContext()
    const [isPending, startTransition] = useTransition()

    const signInCredentials = useCallback(
        <Options extends SignInCredentialsOptions>(options: Options): Promise<SignInCredentialsReturn<Options>> => {
            return new Promise((resolve) => {
                startTransition(async () => {
                    const value = await client.signInCredentials(options)
                    broadcast({ type: "session:sync" })
                    resolve(value)
                })
            })
        },
        [client]
    )

    return { signInCredentials, isPending } as const
}

export const useUpdateSession = <DefaultUser extends User = User>() => {
    const [isPending, startTransition] = useTransition()
    const { client } = useAssertContext<DefaultUser>()

    const updateSession = useCallback(
        <Options extends UpdateSessionOptions<DefaultUser>>(
            options: Options
        ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
            return new Promise((resolve) => {
                startTransition(async () => {
                    const updated = await client.updateSession<Options>(options)
                    broadcast({ type: "session:update", payload: (updated as any).session })
                    resolve(updated)
                })
            })
        },
        [client]
    )

    return { updateSession, isPending } as const
}

export const useSignOut = () => {
    const [isPending, startTransition] = useTransition()
    const { client } = useAssertContext()

    const signOut = useCallback(
        <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
            return new Promise((resolve) => {
                startTransition(async () => {
                    const value = await client.signOut(options)
                    broadcast({ type: "session:clear" })
                    resolve(value)
                })
            })
        },
        [client]
    )

    return { signOut, isPending } as const
}
