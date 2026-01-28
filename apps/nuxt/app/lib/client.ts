import type { Session } from "@aura-stack/auth"

const getCSRFToken = async (): Promise<string> => {
    const data = await $fetch<{ csrfToken: string }>("/api/auth/csrfToken")
    return data.csrfToken
}

const getSession = async (): Promise<Session | null> => {
    return await $fetch<Session | null>("/api/auth/session")
}

const signIn = async (provider: string, redirectTo: string = "/") => {
    window.location.href = `/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo })}`
}

const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    return await $fetch("/api/auth/signOut", {
        method: "POST",
        query: {
            token_type_hint: "session_token",
            redirectTo,
        },
        headers: {
            "X-CSRF-Token": csrfToken,
        },
    })
}

export const createAuthClient = {
    getCSRFToken,
    getSession,
    signIn,
    signOut,
}
