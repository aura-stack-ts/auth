"use client"
import { Session } from "@aura-stack/auth"
import { createContext, use, useCallback, useEffect, useState, useTransition } from "react"
import { AuthClientInstance } from "./@types/types.ts"
import { SignInCredentialsOptions, SignInOptions, SignOutOptions, UpdateSessionOptions } from "@aura-stack/auth/types"

export interface Context {
    session: Session | null
    status: "authenticated" | "unauthenticated" | "pending"
}

export interface ProviderProps {
    initialSession?: Session | null
    client: AuthClientInstance
    children: React.ReactNode
}

export const AuthContext = createContext<Context | undefined>(undefined)

const BROADCAST_CHANNEL_NAME = "aura-auth"

let _channel: BroadcastChannel | null = null

const getBroadcastChannel = (): BroadcastChannel | null => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null
    if (!_channel) _channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    return _channel
}

const broadcast = (message: any): void => {
    getBroadcastChannel()?.postMessage(message)
}

export const __CONTEXT = {
    client: null as AuthClientInstance | null,
    broadcast: getBroadcastChannel(),
}

export const AuthProvider = ({ initialSession, children, client }: ProviderProps) => {
    const [session, setSession] = useState<Session | null>(() => {
        if (initialSession !== undefined) {
            return initialSession
        }
        return null
    })
    const [status, setStatus] = useState<Context["status"]>(initialSession ? "authenticated" : "unauthenticated")

    __CONTEXT.client = client

    const refreshSession = useCallback(async (session: Session | null | undefined = undefined) => {
        setStatus("pending")
        try {
            const next = session ?? (await __CONTEXT.client?.getSession()) ?? null
            setSession(next as Session | null)
            setStatus(next ? "authenticated" : "unauthenticated")
        } catch {
            setSession(null)
            setStatus("unauthenticated")
        }
    }, [])

    useEffect(() => {
        if (initialSession === null) {
            refreshSession()
        }
    }, [initialSession, refreshSession])

    useEffect(() => {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        if (!channel) return

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "session:update") {
                refreshSession(event.data?.payload)
            }
        }

        channel.addEventListener("message", handleMessage)
        return () => channel.removeEventListener("message", handleMessage)
    }, [refreshSession])

    return <AuthContext value={{ session, status }}>{children}</AuthContext>
}

export const useSession = () => {
    const ctx = use(AuthContext)
    if (ctx === undefined) {
        throw new Error("useSession must be used within an <AuthProvider>.")
    }
    return ctx
}

export const useSignIn = () => {
    const [isPending, startTransition] = useTransition()

    const signIn = useCallback((oauth: string, options?: SignInOptions) => {
        startTransition(async () => {
            await __CONTEXT.client?.signIn(oauth, options)
            broadcast({ type: "session:update" })
        })
    }, [])

    return [signIn, isPending] as const
}

export const useSignInCredentials = () => {
    const [isPending, startTransition] = useTransition()

    const signInCredentials = useCallback(<Options extends SignInCredentialsOptions>(options: Options) => {
        startTransition(async () => {
            await __CONTEXT.client?.signInCredentials({
                ...options,
            })
            broadcast({ type: "session:update" })
        })
    }, [])

    return [signInCredentials, isPending] as const
}

export const useUpdateSession = () => {
    const [isPending, startTransition] = useTransition()

    const updateSession = useCallback(<Options extends UpdateSessionOptions>(options: Options) => {
        startTransition(async () => {
            const updated = await __CONTEXT.client?.updateSession(options)
            broadcast({ type: "session:update", payload: updated })
        })
    }, [])

    return [updateSession, isPending] as const
}

export const useSignOut = () => {
    const [isPending, startTransition] = useTransition()

    const signOut = useCallback(<Options extends SignOutOptions>(options?: Options) => {
        startTransition(async () => {
            await __CONTEXT.client?.signOut(options)
            broadcast({ type: "session:update", payload: null })
        })
    }, [])

    return [signOut, isPending] as const
}
