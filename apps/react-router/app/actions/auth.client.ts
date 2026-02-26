import { createClient, type Session, type BuiltInOAuthProvider, type LiteralUnion } from "@aura-stack/auth"

const client = createClient({
    baseURL: window.location.origin,
    basePath: "/api/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string> => {
    const response = await client.get("/csrfToken")
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    const session = await response.json()
    return session
}

export const signIn = async (provide: LiteralUnion<BuiltInOAuthProvider>) => {
    const baseURL = window.location.origin
    window.location.href = `${baseURL}/auth/signIn/${provide}`
}

export const signOut = async (redirectTo: string = "/") => {
    try {
        const csrfToken = await getCSRFToken()
        const response = await client.post("/signOut", {
            searchParams: {
                redirectTo,
                token_type_hint: "session_token",
            },
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
        const session = await response.json()
        return session
    } catch (error) {
        return null
    }
}

export const createAuthClient = {
    getCSRFToken,
    getSession,
    signIn,
    signOut,
}
