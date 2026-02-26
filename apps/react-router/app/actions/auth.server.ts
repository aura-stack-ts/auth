import { redirect } from "react-router"
import { createClient, type Session } from "@aura-stack/auth"

const client = (request: Request) => {
    const baseURL = new URL(request.url).origin
    return createClient({
        baseURL,
        basePath: "/api/auth",
        cache: "no-store",
        credentials: "include",
        headers: Object.fromEntries(request.headers.entries()),
    })
}

export const getCSRFToken = async (request: Request): Promise<string | null> => {
    try {
        const response = await client(request).get("/csrfToken")
        if (!response.ok) return null
        const data = await response.json()
        return data.csrfToken
    } catch (error) {
        console.log("[error:server] getCSRFToken", error)
        return null
    }
}

export const getSession = async (request: Request): Promise<Session | null> => {
    try {
        const response = await client(request).get("/session")
        if (!response.ok) return null
        const session = await response.json()
        return session && session?.user ? session : null
    } catch (error) {
        console.log("[error:server] getSession", error)
        return null
    }
}

export const signIn = async (providerId: string) => {
    return redirect(`/auth/signIn/${providerId}`)
}

export const signOut = async (request: Request, redirectTo: string = "/") => {
    try {
        const csrfToken = await getCSRFToken(request)
        const response = await client(request).post("/signOut", {
            searchParams: {
                redirectTo,
                token_type_hint: "session_token",
            },
            headers: {
                "X-CSRF-Token": csrfToken!,
            },
        })
        if (response.status === 202) {
            return redirect(redirectTo, {
                headers: response.headers,
            })
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.log("[error:server] signOut", error)
        return null
    }
}
