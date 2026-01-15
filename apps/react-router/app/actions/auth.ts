import { redirect } from "react-router"
import type { Session } from "@aura-stack/auth"

const getBaseURL = (originalURL: string) => {
    const url = new URL(originalURL)
    return url.origin
}

export const getCSRFToken = async (request: Request): Promise<string> => {
    const baseURL = getBaseURL(request.url)
    try {
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
    const baseURL = getBaseURL(request.url)
    try {
        const csrfToken = await getCSRFToken(request)
        const response = await fetch(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Cookie: request.headers.get("Cookie") ?? "",
            },
            body: JSON.stringify({}),
            cache: "no-store",
        })
        if (response.status === 202) {
            return redirect("/", {
                headers: response.headers,
            })
        }
        return await response.json()
    } catch (error) {
        throw error
    }
}

export const getSession = async (request: Request): Promise<Session | null> => {
    const baseURL = getBaseURL(request.url)
    try {
        const response = await fetch(`${baseURL}/auth/session`, {
            headers: request.headers,
            cache: "no-store",
        })
        if (!response.ok) {
            return null
        }
        return await response.json()
    } catch (error) {
        return null
    }
}
