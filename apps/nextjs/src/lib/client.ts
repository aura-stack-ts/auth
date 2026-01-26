import { LiteralUnion } from "@aura-stack/auth/types"
import { createRequest } from "./request"
import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const getBaseURL = () => {
    return typeof window !== "undefined" ? window.location.origin : ""
}

export const getCSRFToken = async (): Promise<string> => {
    const response = await createRequest("/auth/csrfToken")
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await createRequest("/auth/session")
    const session = await response.json()
    return session
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    const baseURL = getBaseURL()
    window.location.href = `${baseURL}/auth/signIn/${provider}?${new URLSearchParams({ redirectTo })}`
}

export const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    const response = await createRequest(
        `/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
        {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        }
    )
    const session = await response.json()
    return session
}
