import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"
import type { LiteralUnion } from "@aura-stack/auth/types"

export const getBaseURL = () => {
    return typeof window !== "undefined" ? window.location.origin : ""
}

export const getCSRFToken = async (): Promise<string> => {
    const baseURL = getBaseURL()
    const response = await fetch(`${baseURL}/auth/csrfToken`, {
        method: "GET",
        cache: "no-store",
    })
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const baseURL = getBaseURL()
    const response = await fetch(`${baseURL}/auth/session`, {
        cache: "no-store",
    })
    const session = await response.json()
    return session
}

export const signIn = async (provide: LiteralUnion<BuiltInOAuthProvider>) => {
    const baseURL = getBaseURL()
    window.location.href = `${baseURL}/auth/signIn/${provide}`
}

export const signOut = async () => {
    try {
        const baseURL = getBaseURL()
        const csrfToken = await getCSRFToken()
        const response = await fetch(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
            method: "POST",
            cache: "no-store",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        })
        const session = await response.json()
        return session
    } catch (error) {
        return null
    }
}

export const createAuthClient = {
    getSession,
    signIn,
    signOut,
}
