import { createContext, use, useEffect, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from "react"
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

    useEffect(() => {
        const controller = new AbortController()
        if (!session) {
            const getBaseURL = () => {
                const host = window.location.host
                return `${window.location.protocol}//${host}`
            }

            const fetchSession = async () => {
                try {
                    const baseURL = getBaseURL()
                    const response = await fetch(`${baseURL}/auth/session`, {
                        cache: "no-store",
                        signal: controller.signal,
                    })
                    const session = await response.json()
                    setSession(session)
                } catch {
                    setSession(null)
                }
            }
            fetchSession()
        }

        return () => controller.abort()
    }, [])
    return <AuthContext value={{ session, setSession, isAuthenticated: true }}>{children}</AuthContext>
}

export const useSession = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useSession must be used within an <AuthProvider /> component.")
    }
    return ctx
}
