import type { Session } from "@aura-stack/auth"

export const getSession = async (request: Request): Promise<Session | null> => {
    const getBaseURL = () => {
        const host = window.location.host
        return `${window.location.protocol}//${host}`
    }

    try {
        const baseURL = getBaseURL()
        const response = await fetch(`${baseURL}/auth/session`, {
            headers: request.headers,
            cache: "no-store",
        })
        const session = await response.json()
        return session
    } catch (error) {
        return null
    }
}

export const getCSRFToken = async (request: Request): Promise<string> => {
    const getBaseURL = () => {
        const host = window.location.host
        return `${window.location.protocol}//${host}`
    }
    try {
        const baseURL = getBaseURL()
        const response = await fetch(`${baseURL}/auth/csrfToken`, {
            method: "GET",
            headers: request.headers,
            cache: "no-store",
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`)
        }

        const data = await response.json()
        return data.csrfToken
    } catch (error) {
        throw error
    }
}

export const signOut = async (request: Request) => {
    const getBaseURL = () => {
        const host = window.location.host
        return `${window.location.protocol}//${host}`
    }

    try {
        const baseURL = getBaseURL()
        const csrfToken = await getCSRFToken(request)
        const response = await fetch(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
            method: "POST",
            cache: "no-store",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Cookie: request.headers.get("Cookie") ?? "",
            },
            body: JSON.stringify({}),
        })
        const session = await response.json()
        return session
    } catch (error) {
        return null
    }
}
