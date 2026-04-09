"use client"

import { createContext, useCallback, useEffect, useMemo, useState, useTransition } from "react"
import type {
    CredentialsPayload,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
    Session,
    SignInOptions,
    SignOutOptions,
    User,
} from "@aura-stack/auth/types"
import type { AuthProviderProps, AuthReactContextValue, UpdateSessionCallOptions } from "@/types.ts"

/**
 * React context for {@link AuthReactContextValue}. Use {@link AuthProvider} to supply a client and {@link useAuth} (or other hooks) to read it.
 */
export const AuthContext = createContext<AuthReactContextValue<User> | null>(null)

/**
 * Provides session state and auth actions for the tree, using the {@link AuthProviderProps.client} you pass in.
 * Swap or recreate `client` when you need different configuration; when `client` changes, session is re-synced like on mount.
 */
export const AuthProvider = <DefaultUser extends User = User>({
    children,
    client,
    initialSession,
}: AuthProviderProps<DefaultUser>) => {
    const [session, setSession] = useState<Session<DefaultUser> | null | undefined>(initialSession)
    const [isPending, startTransition] = useTransition()

    const status = useMemo((): AuthReactContextValue<DefaultUser>["status"] => {
        if (session === undefined) return "loading"
        return session ? "authenticated" : "unauthenticated"
    }, [session])

    const refresh = useCallback(async () => {
        startTransition(async () => {
            const next = await client.getSession()
            setSession(next)
        })
    }, [client])

    const signIn = useCallback(
        async (oauth: LiteralUnion<BuiltInOAuthProvider>, signInOptions?: SignInOptions) => {
            const result = await client.signIn(oauth, signInOptions)
            if (!(signInOptions?.redirect ?? true)) {
                await refresh()
            }
            return result
        },
        [client, refresh]
    )

    const signInCredentials = useCallback(
        async (credentials: CredentialsPayload, signInOptions?: SignInOptions) => {
            const result = await client.signInCredentials(credentials, signInOptions)
            if (!(signInOptions?.redirect ?? true)) {
                await refresh()
            }
            return result
        },
        [client, refresh]
    )

    const signOut = useCallback(
        async (signOutOptions?: SignOutOptions) => {
            const result = await client.signOut(signOutOptions)
            if (!(signOutOptions?.redirect ?? true)) {
                await refresh()
            }
            return result
        },
        [client, refresh]
    )

    const updateSession = useCallback(
        async (partial: DeepPartial<Session<DefaultUser>>, callOptions?: UpdateSessionCallOptions) => {
            const result = await client.updateSession(partial)
            if (!callOptions?.skipRefresh) {
                await refresh()
            }
            return result
        },
        [client, refresh]
    )

    useEffect(() => {
        if (initialSession !== undefined) {
            startTransition(() => {
                setSession(initialSession)
            })
            return
        }

        let cancelled = false
        ;(async () => {
            const next = await client.getSession()
            if (!cancelled) {
                startTransition(() => {
                    setSession(next)
                })
            }
        })()

        return () => {
            cancelled = true
        }
    }, [initialSession, client])

    const value = useMemo(
        (): AuthReactContextValue<DefaultUser> => ({
            session,
            status,
            isPending,
            client,
            refresh,
            signIn,
            signInCredentials,
            signOut,
            updateSession,
        }),
        [session, status, isPending, client, refresh, signIn, signInCredentials, signOut, updateSession]
    )

    return <AuthContext.Provider value={value as AuthReactContextValue<User>}>{children}</AuthContext.Provider>
}
