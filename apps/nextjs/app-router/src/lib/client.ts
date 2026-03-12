import { redirect } from "next/navigation"
import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string | null> => {
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

export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await client.get("/session")
        if (!response.ok) return null
        const session = await response.json()
        return session?.authenticated ? session : null
    } catch (error) {
        console.log("[error:client] getSession", error)
        return null
    }
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    return redirect(`/auth/signIn/${provider}?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export const signOut = async (redirectTo: string = "/"): Promise<void> => {
    try {
        const csrfToken = await getCSRFToken()
        if (!csrfToken) {
            console.log("[error:client] signOut - No CSRF token")
            return
        }
        await client.post("/signOut", {
            searchParams: {
                token_type_hint: "session_token",
                redirectTo,
            },
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
    } catch (error) {
        console.log("[error:client] signOut", error)
    }
}
