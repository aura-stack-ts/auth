import { redirect } from "react-router"
import { createRequest } from "~/lib/request"
import type { Session } from "@aura-stack/auth"

const getBaseURL = (request: Request) => {
    return new URL(request.url).origin
}

export const getCSRFToken = async (request: Request): Promise<string> => {
    try {
        const baseURL = getBaseURL(request)
        const response = await createRequest(`${baseURL}/auth/csrfToken`, {
            headers: request.headers,
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

export const signIn = async (providerId: string) => {
    return redirect(`/auth/signIn/${providerId}`)
}

export const signOut = async (request: Request, redirectTo: string = "/") => {
    const baseURL = getBaseURL(request)
    try {
        const csrfToken = await getCSRFToken(request)
        const response = await createRequest(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
        if (response.status === 202) {
            return redirect(redirectTo, {
                headers: response.headers,
            })
        }
        const data = await response.json()
        return data
    } catch (error) {
        throw error
    }
}

export const getSession = async (request: Request): Promise<Session | null> => {
    const baseURL = getBaseURL(request)
    try {
        const response = await createRequest(`${baseURL}/auth/session`, {
            headers: request.headers,
        })
        if (!response.ok) {
            return null
        }
        const session = await response.json()
        return session
    } catch (error) {
        return null
    }
}
