"use client"
import type { User } from "@aura-stack/auth"
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
    SignUpOptions,
    SignUpReturn,
    UpdateSessionOptions,
    UpdateSessionReturn,
    GetProviderTokensReturn,
} from "@aura-stack/auth/types"
import type { Context } from "@/@types/types.ts"

const useAssertContext = <DefaultUser extends User = User>() => {
    const ctx = use(AuthContext)
    if (ctx === undefined) {
        throw new Error("Auth hooks must be used within an <AuthProvider>.")
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

const performRedirect = async (redirect: ((url: string) => void | Promise<void>) | undefined, url?: string | null) => {
    if (!url) return
    if (redirect) {
        await redirect(url)
        return
    }
    window.location.assign(url)
}

/**
 * Gets the current authentication session and status.
 *
 * @returns An object containing the current session, status and a isPending
 * @example
 * const Page = () => {
 *   const { session, status, isPending } = useSession()
 *   if (isPending) {
 *     return <div>Loading...</div>
 *   }
 *   return <div>{session ? `Hello, ${session.user.name}` : "Not signed in"}</div>
 * }
 */
export const useSession = <DefaultUser extends User = User>() => {
    const { session, status } = useAssertContext<DefaultUser>()
    return { session, status, isPending: status === "pending" } as const
}

/**
 * Initiates the OAuth sign-in process to third-party providers.
 *
 * @returns An object containing the signIn function and a isPending state
 * @example
 * const Page = () => {
 *   const { signIn, isPending } = useSignIn()
 *   return (
 *     <button onClick={() => signIn("google")} disabled={isPending}>
 *       Sign in with Google
 *     </button>
 *   )
 * }
 */
export const useSignIn = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signIn = useCallback(
        <Options extends SignInOptions>(
            oauth: LiteralUnion<BuiltInOAuthProvider>,
            options?: Options
        ): Promise<SignInReturn<Options>> => {
            return execute(async () => {
                const value = (await client.signIn(oauth, {
                    ...options,
                    redirect: false,
                })) as any
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.signInURL)
                }
                if (value.success) {
                    broadcast({ type: "session:sync" })
                }
                return value as unknown as SignInReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { signIn, isPending } as const
}

/**
 * Signs in a user using their credentials (e.g. username and password).
 *
 * @returns An object containing the signInCredentials function and a isPending state
 * @example
 * const Page = () => {
 *   const { signInCredentials, isPending } = useSignInCredentials()
 *
 *   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 *     event.preventDefault()
 *     const formData = new FormData(event.currentTarget)
 *     const username = formData.get("username") as string
 *     const password = formData.get("password") as string
 *     await signInCredentials({ payload: { username, password }, redirectTo: "/dashboard" })
 *   }
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="username" type="text" placeholder="Username" required />
 *       <input name="password" type="password" placeholder="Password" required />
 *       <button type="submit" disabled={isPending}>Sign In</button>
 *     </form>
 *   )
 * }
 */
export const useSignInCredentials = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signInCredentials = useCallback(
        <Options extends SignInCredentialsOptions>(options: Options): Promise<SignInCredentialsReturn<Options>> => {
            return execute(async () => {
                const value = await client.signInCredentials({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                if (value.success) {
                    broadcast({ type: "session:sync" })
                }
                return value
            })
        },
        [client, execute, redirect]
    )

    return { signInCredentials, isPending } as const
}

/**
 * Signs up a new user.
 *
 * @returns An object containing the signUp function and a isPending state
 * @example
 * const Page = () => {
 *   const { signUp, isPending } = useSignUp()
 *
 *   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 *     event.preventDefault()
 *     const formData = new FormData(event.currentTarget)
 *     const username = formData.get("username") as string
 *     const password = formData.get("password") as string
 *     await signUp({ payload: { username, password }, redirectTo: "/dashboard" })
 *   }
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="username" type="text" placeholder="Username" required />
 *       <input name="password" type="password" placeholder="Password" required />
 *       <button type="submit" disabled={isPending}>Sign Up</button>
 *     </form>
 *   )
 * }
 */
export const useSignUp = <Payload extends Record<string, any> = Record<string, any>>() => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signUp = useCallback(
        <Options extends SignUpOptions<Payload>>(options: Options): Promise<SignUpReturn<Options>> => {
            return execute(async () => {
                const value = await client.signUp({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                if (value.success) {
                    broadcast({ type: "session:sync" })
                }
                return value
            })
        },
        [client, execute, redirect]
    )

    return { signUp, isPending } as const
}

/**
 * Updates the current user's session.
 *
 * @returns An object containing the updateSession function and a isPending state
 * @example
 * const Page = () => {
 *   const { session } = useSession()
 *   const { updateSession, isPending } = useUpdateSession()
 *
 *   const handleUpdate = async () => {
 *     if (session) {
 *       await updateSession({ session: { user: { name: "New Name" } } })
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <p>Name: {session?.user.name}</p>
 *       <button onClick={handleUpdate} disabled={isPending}>Update Name</button>
 *     </div>
 *   )
 * }
 */
export const useUpdateSession = <DefaultUser extends User = User>() => {
    const { client, redirect } = useAssertContext<DefaultUser>()
    const { execute, isPending } = useAsyncAction()

    const updateSession = useCallback(
        <Options extends UpdateSessionOptions<DefaultUser>>(
            options: Options
        ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
            return execute(async () => {
                const updated = await client.updateSession({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, updated.redirectURL)
                }
                if (updated.success) {
                    broadcast({ type: "session:update", payload: updated.session })
                }
                return updated
            })
        },
        [client, execute, redirect]
    )

    return { updateSession, isPending } as const
}

/**
 * Signs out the current user.
 *
 * @returns An object containing the signOut function and a isPending state
 * @example
 * const Page = () => {
 *   const { signOut, isPending } = useSignOut()
 *   return (
 *     <button onClick={() => signOut({ redirect: true, redirectTo: "/" })} disabled={isPending}>
 *       Sign Out
 *     </button>
 *   )
 * }
 */
export const useSignOut = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signOut = useCallback(
        <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
            return execute(async () => {
                const value = await client.signOut({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                if (value.success) {
                    broadcast({ type: "session:clear" })
                }
                return value as unknown as SignOutReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { signOut, isPending } as const
}

/**
 * Fetches the provider tokens for a given OAuth provider.
 *
 * @returns An object containing the accessToken, refreshToken, and expiresIn values, along with a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const [songs, setSongs] = useState<string[]>([])
 *   const { getProviderTokens, isPending } = useProviderTokens()
 *
 *   useEffect(() => {
 *     const fetchTokens = async () => {
 *       const { success, tokens } = await getProviderTokens("spotify")
 *       if (!success || !tokens) return
 *       const { accessToken } = tokens
 *
 *       const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
 *         headers: {
 *           Authorization: `Bearer ${accessToken}`,
 *         }
 *       })
 *       const data = await response.json()
 *       setSongs(data.items.map((item: any) => item.name))
 *     }
 *
 *     fetchTokens()
 *   }, [])
 * }
 */
export const useProviderTokens = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const getProviderTokens = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<GetProviderTokensReturn> => {
            return execute(async () => {
                const tokens = await client.getProviderTokens(oauth)
                return tokens
            })
        },
        [client, execute]
    )

    return { getProviderTokens, isPending } as const
}

/**
 * Centralized hook that provides all authentication actions and their pending states.
 *
 * @returns An object containing all auth actions (signIn, signInCredentials, updateSession,
 * signOut and signUp) and a combined isPending state
 * @example
 * const Page = () => {
 *   const { signIn, signInCredentials, updateSession, signOut, signUp, isPending } = useAuthActions()
 *   // Use the actions as needed in your component
 *   return <p>Auth actions are ready to use. isPending: {isPending ? "Yes" : "No"}</p>
 * }
 */
export const useAuthActions = <DefaultUser extends User = User>() => {
    const { signIn, isPending: isSignInPending } = useSignIn()
    const { signInCredentials, isPending: isSignInCredentialsPending } = useSignInCredentials()
    const { updateSession, isPending: isUpdateSessionPending } = useUpdateSession<DefaultUser>()
    const { signOut, isPending: isSignOutPending } = useSignOut()
    const { signUp, isPending: isSignUpPending } = useSignUp()

    return {
        isPending: isSignInPending || isSignInCredentialsPending || isUpdateSessionPending || isSignOutPending || isSignUpPending,
        signIn,
        signInCredentials,
        updateSession,
        signOut,
        signUp,
    } as const
}
