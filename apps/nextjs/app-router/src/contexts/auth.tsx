"use client"

import { createContext, use, useState, useEffect } from "react"
import { authClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import type { Session, LiteralUnion, BuiltInOAuthProvider, SignInOptions, SignOutOptions } from "@aura-stack/auth"
import type { AuthContextValue } from "@/@types/types"
import type { AuthProviderProps } from "@/@types/props"

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(defaultSession === undefined)
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const isAuthenticated = Boolean(session?.user)

    const signOut = async (options?: SignOutOptions) => {
        setIsLoading(true)
        try {
            await authClient.signOut(options)
            setSession(null)
            router.refresh()
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInOptions) => {
        setIsLoading(true)
        try {
            await authClient.signIn(provider, { ...options, redirect: true })
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
                const session = await authClient.getSession()
                setSession(session)
            } catch (error) {
                console.error("Error fetching session:", error)
                setSession(null)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSession()
    }, [defaultSession])

    return (
        <AuthContext value={{ session, isAuthenticated, isLoading, signIn, signOut } as AuthContextValue}>{children}</AuthContext>
    )
}

export const useAuthClient = () => {
    const ctx = use(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return ctx
}
