"use client"

import { createContext, use, useState, useEffect } from "react"
import { authClient } from "@/lib/client"
import type { Session, LiteralUnion, BuiltInOAuthProvider, SignInOptions, SignOutOptions } from "@aura-stack/auth"
import type { AuthContextValue } from "@/@types/types"
import type { AuthProviderProps } from "@/@types/props"

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children, session: defaultSession }: AuthProviderProps) => {
    const [isLoading, setIsLoading] = useState(defaultSession === undefined)
    const [session, setSession] = useState<Session | null>(defaultSession ?? null)
    const isAuthenticated = Boolean(session?.user)

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInOptions) => {
        setIsLoading(true)
        try {
            return await authClient.signIn(provider, { redirect: true, ...options })
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        setIsLoading(true)
        try {
            const value = await authClient.signOut(options)
            setSession(null)
            return value
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
            } catch {
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
