import { createContext, use, useState, useEffect } from "react"
import { authClient } from "@/lib/client"
import type { Session } from "@aura-stack/auth"
import type { AuthProviderProps } from "@/@types/props"

export interface AuthContextValue {
    session: Session | null
    isAuthenticated: boolean
    isLoading: boolean
    signIn: ReturnType<typeof authClient>["signIn"]
    signOut: ReturnType<typeof authClient>["signOut"]
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const { getSession, signIn: signInClient, signOut: signOutClient } = authClient()

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const [isLoading, setIsLoading] = useState(defaultSession === undefined)
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const isAuthenticated = Boolean(session?.user)

    const signOut = async (...args: Parameters<typeof signOutClient>) => {
        setIsLoading(true)
        try {
            await signOutClient(...args)
            setSession(null)
        } catch (error) {
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async (...args: Parameters<typeof signInClient>) => {
        setIsLoading(true)
        try {
            return await signInClient(...args)
        } catch (error) {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (defaultSession !== undefined) {
            setSession(defaultSession)
            setIsLoading(false)
            return
        }

        const fetchSession = async () => {
            try {
                const session = await getSession()
                setSession(session)
            } catch {
                setSession(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSession()
    }, [defaultSession])

    return (
        <AuthContext
            value={{
                session,
                isAuthenticated,
                isLoading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext>
    )
}

/**
 * Standard hook to access auth state and actions on the client.
 */
export const useAuth = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return ctx
}
