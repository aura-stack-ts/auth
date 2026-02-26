import { client } from "./client.api"
import type { LiteralUnion, BuiltInOAuthProvider, Session  } from "@aura-stack/auth"

export const getCsrfToken = async (): Promise<string> => {
    const response = await client.get("/csrfToken")
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    const session = await response.json()
    return session && session.user ? session : null
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>): Promise<void> => {
    window.location.href = `http://localhost:3000/api/auth/signIn/${provider}`
}

export const signOut = async (redirectTo: string = "/"): Promise<void> => {
    const csrfToken = await getCsrfToken()
    const response = await client.post("/signOut", {
        searchParams: {
            token_type_hint: "session_token",
            redirectTo: redirectTo,
        },
        headers: {
            "X-CSRF-Token": csrfToken,
        },
    })
    if (response.redirected) {
        window.location.href = response.url
        return
    }
    await response.json()
}

export const createAuthClient = {
    getCsrfToken,
    getSession,
    signIn,
    signOut,
}
