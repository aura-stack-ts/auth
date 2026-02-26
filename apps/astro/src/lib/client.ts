import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

export const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    basePath: "/api/auth",
    cache: "no-store",
    credentials: "include",
})

const getCSRFToken = async (): Promise<string | null> => {
    const response = await client.get("/csrfToken")
    if (!response.ok) return null
    const data = await response.json()
    return data.csrfToken
}

const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    if (!response.ok) return null
    const session = await response.json()
    return session
}

const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    const baseURL = window.location.origin
    window.location.href = `${baseURL}/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo })}`
}

const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    const response = await client.post("/signOut", {
        searchParams: {
            redirectTo,
            token_type_hint: "session_token",
        },
        headers: {
            "X-CSRF-Token": csrfToken!,
        },
    })
    const session = await response.json()
    return session
}

export const createAuthClient = {
    getCSRFToken,
    getSession,
    signIn,
    signOut,
}
