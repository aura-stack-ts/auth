import { client } from "./client.api"
import type { LiteralUnion, BuiltInOAuthProvider, Session } from "@aura-stack/auth"

export const getCsrfToken = async (): Promise<string | null> => {
    try {
        const response = await client.get("/csrfToken")
        const json = await response.json()
        return json && json?.csrfToken ? json.csrfToken : null
    } catch (error) {
        console.log("[error:client] getCsrfToken", error)
        return null
    }
}

export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await client.get("/session")
        const session = await response.json()
        return session && session.user ? session : null
    } catch (error) {
        console.log("[error:client] getSession", error)
        return null
    }
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>): Promise<void> => {
    window.location.href = `/api/auth/signIn/${provider}`
}

export const signOut = async (redirectTo: string = "/"): Promise<void> => {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            console.error("[error:client] signOut - No CSRF token")
            return
        }
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
    } catch (error) {
        console.log("[error:client] signOut", error)
    }
}

export const createAuthClient = {
    getCsrfToken,
    getSession,
    signIn,
    signOut,
}
