import { createRequest } from "~/lib/request"
import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"
import type { LiteralUnion } from "@aura-stack/auth/types"

const getBaseURL = () => {
    return window.location.origin
}

export const getCSRFToken = async (): Promise<string> => {
    const baseURL = getBaseURL()
    const response = await createRequest(`${baseURL}/auth/csrfToken`)
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const baseURL = getBaseURL()
    const response = await createRequest(`${baseURL}/auth/session`)
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
        const response = await createRequest(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
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
