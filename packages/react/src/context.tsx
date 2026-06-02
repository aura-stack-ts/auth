import { createContext, useCallback, useEffect, useRef, useState } from "react"
import type { Session, User } from "@aura-stack/auth"
import type { AuthClientInstance, AuthProviderProps, BroadcastMessage, Context } from "@/@types/types.ts"

export { AuthProviderProps }

export const AuthContext = createContext<Context | undefined>(undefined)

const BROADCAST_CHANNEL_NAME = "aura-auth"

let _channel: BroadcastChannel | null = null

const isSupportedBroadcastChannel = (): boolean => {
    return typeof window !== "undefined" && "BroadcastChannel" in window
}

const getBroadcastChannel = (): BroadcastChannel | null => {
    if (!isSupportedBroadcastChannel()) return null
    if (!_channel) _channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    return _channel
}

export const broadcast = (message: BroadcastMessage): void => {
    getBroadcastChannel()?.postMessage(message)
}

/**
 * Wrapper component that provides authentication context in client-side React applications.
 *
 * @param {AuthProviderProps<DefaultUser>} props The properties for the AuthProvider component
 * @returns {JSX.Element} The AuthProvider component that wraps its children with authentication context
 * @example
 * const client = createAuthClient({ baseURL: "http://localhost:3000" })
 *
 * <AuthProvider client={client}>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = <DefaultUser extends User = User>({
    initialSession,
    children,
    client,
    redirect,
}: AuthProviderProps<DefaultUser>) => {
    const clientRef = useRef<AuthClientInstance<DefaultUser>>(client)
    clientRef.current = client

    const [session, setSession] = useState<Session<DefaultUser> | null>(() => {
        if (initialSession !== undefined) {
            return initialSession
        }
        return null
    })
    const [status, setStatus] = useState<Context["status"]>(initialSession ? "authenticated" : "unauthenticated")

    const refreshSession = useCallback(async (session: Session | null | undefined = undefined) => {
        setStatus("pending")
        try {
            const next = session !== undefined ? session : ((await clientRef.current.getSession()) ?? null)
            setSession(next as Session<DefaultUser> | null)
            setStatus(next ? "authenticated" : "unauthenticated")
        } catch {
            setSession(null)
            setStatus("unauthenticated")
        }
    }, [])

    useEffect(() => {
        if (initialSession === undefined) {
            refreshSession()
        }
    }, [initialSession, refreshSession])

    useEffect(() => {
        if (!isSupportedBroadcastChannel()) return
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)

        const handleBroadcast = (event: MessageEvent<BroadcastMessage>) => {
            if (event.data.type === "session:update") {
                refreshSession(event.data.payload)
            }
            if (event.data.type === "session:sync") {
                refreshSession()
            }
            if (event.data.type === "session:clear") {
                refreshSession(null)
            }
        }

        channel.addEventListener("message", handleBroadcast)
        return () => {
            channel.removeEventListener("message", handleBroadcast)
            channel.close()
        }
    }, [refreshSession])

    return <AuthContext value={{ session, status, client: clientRef.current, redirect }}>{children}</AuthContext>
}
