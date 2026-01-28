"use client"
import { createContext, use, useState, useEffect } from "react"
import { createAuthClient } from "@/lib/client"
import type { Session } from "@aura-stack/auth"
import type { AuthContextValue } from "@/@types/types"
import type { AuthProviderProps } from "@/@types/props"

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const { signIn: signInClient, signOut: signOutClient, getSession } = createAuthClient()

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const [isLoading, setIsLoading] = useState(defaultSession === undefined)
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const isAuthenticated = Boolean(session?.user)

    const signOut = async (...args: Parameters<typeof signOutClient>) => {
        setIsLoading(true)
        try {
            await signOutClient(...args)
            setSession(null)
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async (...args: Parameters<typeof signInClient>) => {
        setIsLoading(true)
        try {
            await signInClient(...args)
            const session = await getSession()
            setSession(session)
        } finally {
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

    return <AuthContext value={{ session, isAuthenticated, isLoading, signIn, signOut }}>{children}</AuthContext>
}

export const useAuthClient = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return ctx
}
