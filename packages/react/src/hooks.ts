"use client"
import type { Session, User } from "@aura-stack/auth"
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
 *     const fetchSongs = async () => {
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
 *     fetchSongs()
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
 * Fetches the OAuth access token for a given provider.
 *
 * @returns An string access token or null if the token is not available, along with a isPending state
 * @example
 * import { useEffect, useState } from "react"
 *
 * const Page = () => {
 *   const [songs, setSongs] = useState<string[]>([])
 *   const { getAccessToken, isPending } = useAccessToken()
 *
 *   useEffect(() => {
 *     const fetchSongs = async () => {
 *       const accessToken = await getAccessToken("spotify")
 *       if (!accessToken) return
 *
 *      const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
 *        headers: { Authorization: `Bearer ${accessToken}` },
 *      })
 *
 *      const data = await response.json()
 *      setSongs(data.items.map((item: any) => item.name))
 *    }
 *
 *    fetchSongs()
 *  }, [])
 * }
 */
export const useAccessToken = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const getAccessToken = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<string | null> => {
            return execute(async () => {
                const accessToken = await client.getAccessToken(oauth)
                return accessToken
            })
        },
        [client, execute]
    )

    return { getAccessToken, isPending } as const
}

/**
 * Revokes the OAuth access token for a given provider. It revokes the token by calling
 * the provider's token revocation endpoint, if available.
 *
 * > **NOTE**: The token revocation process is a hard operation, if you do not want to revoke
 * the token, but just disconnect the provider from the user, you can use `useDisconnectProvider` hook.
 *
 * @returns An object containing the revokeToken function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { revokeToken, isPending } = useRevokeToken()
 *
 *   const handleRevoke = async () => {
 *     const success = await revokeToken("spotify")
 *     if (success) {
 *       console.log("Token revoked successfully")
 *     } else {
 *       console.log("Failed to revoke token")
 *     }
 *   }
 * }
 */
export const useRevokeToken = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const revokeToken = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<void> => {
            return execute(async () => {
                await client.revokeToken(oauth)
            })
        },
        [client, execute]
    )

    return { revokeToken, isPending } as const
}

/**
 * Disconnets the OAuth provider with the current user, removing the association between the
 * user's account and the OAuth provider. This action does not revoke the OAuth token, but it
 * removes the link between the user's account and the provider, effectively "disconnecting" the provider.
 *
 * > **NOTE**: For a complete disconnection, you may want to use `useRevokeToken` hook.
 *
 * @returns An object containing the disconnectProvider function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { disconnectProvider, isPending } = useDisconnectProvider()
 *
 *   const handleDisconnect = async () => {
 *     const success = await disconnectProvider("spotify")
 *     if (success) {
 *       console.log("Provider disconnected successfully")}
 *     } else {
 *      console.log("Failed to disconnect provider")
 *     }
 *   }
 * }
 */
export const useDisconnectProvider = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const disconnectProvider = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<void> => {
            return execute(async () => {
                await client.disconnectProvider(oauth)
            })
        },
        [client, execute]
    )

    return { disconnectProvider, isPending } as const
}

/**
 * Verifies if the OAuth provider is connected with the current user.
 *
 * @returns An object containing the isProviderConnected function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { isProviderConnected, isPending } = useIsProviderConnected()
 *
 *   const handleCheckConnection = async () => {
 *     const connected = await isProviderConnected("spotify")
 *     if (connected) {
 *       console.log("Provider is connected")
 *     } else {
 *       console.log("Provider is not connected")
 *     }
 *   }
 * }
 */
export const useIsProviderConnected = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const isProviderConnected = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
            return execute(async () => {
                const connected = await client.isProviderConnected(oauth)
                return connected
            })
        },
        [client, execute]
    )

    return { isProviderConnected, isPending } as const
}

/**
 * Fetches the `/userinfo` endpoint of the OAuth provider to refresh the user's information.
 *
 * @returns An object containing the refreshUserInfo function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { isProviderConnected } = useIsProviderConnected("google")
 *   const { refreshUserInfo, isPending } = useRefreshUserInfo()
 *
 *   useEffect(() => {
 *     const fetchUserInfo = async () => {
 *       const connected = await isProviderConnected()
 *       if (connected) {
 *         const session = await refreshUserInfo("google")
 *         if (session) {
 *           console.log("User info refreshed:", session.user)
 *         } else {
 *           console.log("Failed to refresh user info")
 *         }
 *       }
 *     }
 *   }, [])
 * }
 */
export const useRefreshUserInfo = <DefaultUser extends User = User>() => {
    const { client } = useAssertContext<DefaultUser>()
    const { execute, isPending } = useAsyncAction()

    const refreshUserInfo = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<Session<DefaultUser> | null> => {
            return execute(async () => {
                const session = await client.refreshUserInfo(oauth)
                broadcast({ type: "session:sync" })
                return session
            })
        },
        [client, execute]
    )

    return { refreshUserInfo, isPending } as const
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
