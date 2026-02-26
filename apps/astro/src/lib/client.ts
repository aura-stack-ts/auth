import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

export const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    basePath: "/api/auth",
    cache: "no-store",
    credentials: "include",
})

const getCSRFToken = async (): Promise<string | null> => {
    try {
        const response = await client.get("/csrfToken")
        if (!response.ok) return null
        const data = await response.json()
        return data.csrfToken
    } catch (error) {
        console.log("[error:client] getCSRFToken", error)
        return null
    }
}

const getSession = async (): Promise<Session | null> => {
    try {
        const response = await client.get("/session")
        if (!response.ok) return null
        const session = await response.json()
        return session && session?.user ? session : null
    } catch (error) {
        console.log("[error:client] getSession", error)
        return null
    }
}

const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    const baseURL = window.location.origin
    window.location.href = `${baseURL}/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo })}`
}

const signOut = async (redirectTo: string = "/") => {
    try {
        const csrfToken = await getCSRFToken()
        if (!csrfToken) {
            console.log("[error:client] signOut - No CSRF token found")
            return null
        }
        const response = await client.post("/signOut", {
            searchParams: {
                redirectTo,
                token_type_hint: "session_token",
            },
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
        const json = await response.json()
        return json
    } catch (error) {
        console.log("[error:client] signOut", error)
        return null
    }
}

export const createAuthClient = {
    getCSRFToken,
    getSession,
    signIn,
    signOut,
}
