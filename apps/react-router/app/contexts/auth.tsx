import { createContext, use, useEffect, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from "react"
import { getSession } from "~/actions/auth.client"
import type { Session } from "@aura-stack/auth"

interface AuthContextValue {
    session: Session | null
    setSession: Dispatch<SetStateAction<Session | null>>
    isAuthenticated: boolean
}

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const isAuthenticated = !!session?.user

    useEffect(() => {
        if (!session) {
            const fetchSession = async () => {
                try {
                    const session = await getSession()
                    setSession(session)
                } catch {
                    setSession(null)
                }
            }
            fetchSession()
        }
    }, [])
    return <AuthContext value={{ session, setSession, isAuthenticated }}>{children}</AuthContext>
}

export const useSession = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useSession must be used within an <AuthProvider /> component.")
    }
    return ctx
}
