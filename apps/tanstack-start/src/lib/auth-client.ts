import { createClient, type Session } from "@aura-stack/auth"

const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
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

export const signOut = async (redirectTo: string = "/") => {
    try {
        const csrfToken = await getCSRFToken()
        if (!csrfToken) {
            console.error("[error:client] signOut - No CSRF token")
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
