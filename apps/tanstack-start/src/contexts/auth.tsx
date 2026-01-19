import { createContext, use, useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import type { Session } from "@aura-stack/auth"
import type { AuthContextValue } from "@/@types/types"
import type { AuthProviderProps } from "@/@types/props"

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const [isLoading, setIsLoading] = useState(true)
    const isAuthenticated = !!session?.user

    useEffect(() => {
        if (defaultSession) {
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

    return <AuthContext value={{ session, setSession, isAuthenticated, isLoading }}>{children}</AuthContext>
}

export const useSession = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useSession must be used within an <AuthProvider /> component.")
    }
    return ctx
}
