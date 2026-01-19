import { AUTH_API_ENDPOINTS } from "./constants"
import type { Session } from "@aura-stack/auth"

export const getBaseURL = () => {
    return typeof window !== "undefined" ? window.location.origin : ""
}

export const getCSRFToken = async (): Promise<string> => {
    const baseURL = getBaseURL()
    const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.CSRF_TOKEN}`, {
        method: "GET",
        cache: "no-store",
    })
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const baseURL = getBaseURL()
    const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.SESSION}`, {
        cache: "no-store",
        credentials: "include",
    })
    const session = await response.json()
    return session
}

export const signOut = async () => {
    try {
        const baseURL = getBaseURL()
        const csrfToken = await getCSRFToken()
        const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.SIGN_OUT}?token_type_hint=session_token`, {
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
