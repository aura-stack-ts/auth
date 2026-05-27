"use client"
import { User } from "@aura-stack/auth"
import { use, useCallback, useTransition } from "react"
import { AuthContext, broadcast } from "@/context.tsx"
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
import type { Context } from "@/@types/types.ts"

const useAssertContext = <DefaultUser extends User = User>() => {
    const ctx = use(AuthContext)
    if (ctx === undefined) {
        throw new Error("useAuth must be used within an <AuthProvider>.")
    }
    return ctx as Context<DefaultUser>
}

const useAsyncAction = () => {
    const [isPending, startTransition] = useTransition()

    const execute = useCallback(<T>(action: () => Promise<T>): Promise<T> => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const value = await action()
                    resolve(value)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }, [])

    return { execute, isPending } as const
}

export const useSession = <DefaultUser extends User = User>() => {
    const { session, status } = useAssertContext<DefaultUser>()
    return { session, status, isPending: status === "pending" } as const
}

export const useSignIn = () => {
    const { client } = useAssertContext()
    //const [isPending, startTransition] = useTransition()
    const { execute, isPending } = useAsyncAction()

    const signIn = useCallback(
        <Options extends SignInOptions>(
            oauth: LiteralUnion<BuiltInOAuthProvider>,
            options?: Options
        ): Promise<SignInReturn<Options>> => {
            //return new Promise((resolve, reject) => {
            //startTransition(async () => {
            //    try {
            //        const value = await client.signIn(oauth, options)
            //        broadcast({ type: "session:sync" })
            //        resolve(value)
            //    } catch (error) {
            //        reject(error)
            //    }
            //})
            //})
            return execute(async () => {
                const value = await client.signIn(oauth, options)
                broadcast({ type: "session:sync" })
                return value
            })
        },
        [client, execute]
    )

    return { signIn, isPending } as const
}

export const useSignInCredentials = () => {
    const { client } = useAssertContext()
    //const [isPending, startTransition] = useTransition()
    const { execute, isPending } = useAsyncAction()

    const signInCredentials = useCallback(
        <Options extends SignInCredentialsOptions>(options: Options): Promise<SignInCredentialsReturn<Options>> => {
            //return new Promise((resolve, reject) => {
            //    startTransition(async () => {
            //        try {
            //            const value = await client.signInCredentials(options)
            //            broadcast({ type: "session:sync" })
            //            resolve(value)
            //        } catch (error) {
            //            reject(error)
            //        }
            //    })
            //})
            return execute(async () => {
                const value = await client.signInCredentials(options)
                broadcast({ type: "session:sync" })
                return value
            })
        },
        [client, execute]
    )

    return { signInCredentials, isPending } as const
}

export const useUpdateSession = <DefaultUser extends User = User>() => {
    //const [isPending, startTransition] = useTransition()
    const { client } = useAssertContext<DefaultUser>()
    const { execute, isPending } = useAsyncAction()

    const updateSession = useCallback(
        <Options extends UpdateSessionOptions<DefaultUser>>(
            options: Options
        ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
            //return new Promise((resolve, reject) => {
            //    startTransition(async () => {
            //        try {
            //            const updated = await client.updateSession<Options>(options)
            //            broadcast({ type: "session:update", payload: (updated as any).session })
            //            resolve(updated)
            //        } catch (error) {
            //            reject(error)
            //        }
            //    })
            //})
            return execute(async () => {
                const updated = await client.updateSession<Options>(options)
                broadcast({ type: "session:update", payload: (updated as any).session })
                return updated
            })
        },
        [client, execute]
    )

    return { updateSession, isPending } as const
}

export const useSignOut = () => {
    //const [isPending, startTransition] = useTransition()
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signOut = useCallback(
        <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
            //return new Promise((resolve, reject) => {
            //    startTransition(async () => {
            //        try {
            //            const value = await client.signOut(options)
            //            broadcast({ type: "session:clear" })
            //            resolve(value)
            //        } catch (error) {
            //            reject(error)
            //        }
            //    })
            //})
            return execute(async () => {
                const value = await client.signOut(options)
                broadcast({ type: "session:clear" })
                return value
            })
        },
        [client, execute]
    )

    return { signOut, isPending } as const
}

export const useAuthActions = <DefaultUser extends User = User>() => {
    const { signIn, isPending: isSignInPending } = useSignIn()
    const { signInCredentials, isPending: isSignInCredentialsPending } = useSignInCredentials()
    const { updateSession, isPending: isUpdateSessionPending } = useUpdateSession<DefaultUser>()
    const { signOut, isPending: isSignOutPending } = useSignOut()

    return {
        isPending: isSignInPending || isSignInCredentialsPending || isUpdateSessionPending || isSignOutPending,
        signIn,
        signInCredentials,
        updateSession,
        signOut,
    } as const
}
