import { createClient, type Session, type BuiltInOAuthProvider, type LiteralUnion } from "@aura-stack/auth"

const client = createClient({
    baseURL: window.location.origin,
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string | null> => {
    try {
        const response = await client.get("/csrfToken")
        const json = await response.json()
        return json && json?.csrfToken ? json.csrfToken : null
    } catch (error) {
        console.log("[error:client] getCSRFToken", error)
        return null
    }
}

export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await client.get("/session")
        const session = await response.json()
        return session && session?.user ? session : null
    } catch (error) {
        console.log("[error:client] getSession", error)
        return null
    }
}

export const signIn = async (provide: LiteralUnion<BuiltInOAuthProvider>) => {
    console.log("[client] signIn - provider:", provide)
    const baseURL = window.location.origin
    window.location.href = `${baseURL}/auth/signIn/${provide}`
}

export const signOut = async (redirectTo: string = "/") => {
    try {
        const csrfToken = await getCSRFToken()
        if (!csrfToken) {
            console.error("[error:client] signOut - No CSRF token")
            return
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
        const session = await response.json()
        return session
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
