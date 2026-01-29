import type { LiteralUnion } from "@aura-stack/auth/types"
import { createRequest } from "./request"
import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

const getBaseURL = () => {
    return typeof window !== "undefined" ? window.location.origin : ""
}

const getCSRFToken = async (): Promise<string> => {
    const response = await createRequest("/api/auth/csrfToken")
    const data = await response.json()
    return data.csrfToken
}

const getSession = async (): Promise<Session | null> => {
    const response = await createRequest("/api/auth/session")
    const session = await response.json()
    return session
}

const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    const baseURL = getBaseURL()
    window.location.href = `${baseURL}/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo })}`
}

const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    const response = await createRequest(
        `/api/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
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

export const createAuthClient = () => {
    return {
        getCSRFToken,
        getSession,
        signIn,
        signOut,
    }
}
