import { LiteralUnion } from "@aura-stack/auth/types"
import { createRequest } from "./request"
import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

const getBaseURL = () => {
    return typeof window !== "undefined" ? window.location.origin : ""
}

export const getCsrfToken = async (): Promise<string> => {
    const response = await createRequest("/api/auth/csrfToken")
    if (!response.ok) throw new Error("Failed to fetch CSRF token")
    const data = await response.json()
    return data.csrfToken
}


export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await createRequest("/api/auth/session")
        if (!response.ok) return null
        const session = await response.json()
        return session && session.user ? session : null
    } catch {
        return null
    }
}


export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>): Promise<void> => {
    const baseURL = getBaseURL()
    window.location.href = `${baseURL}/api/auth/signIn/${provider}`
}


export const signOut = async (options?: { redirectTo?: string }): Promise<void> => {
    const { redirectTo = "/" } = options ?? {}
    const baseURL = getBaseURL()
    const csrfToken = await getCsrfToken()
    
    const response = await fetch(
        `${baseURL}/api/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
        {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        }
    )
    if (response.redirected) {
        window.location.href = response.url
        return
    }
    await response.json()
}


export const authClient = {
    getCsrfToken,
    getSession,
    signIn,
    signOut,
}
