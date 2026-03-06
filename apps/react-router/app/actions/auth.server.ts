import { redirect } from "react-router"
import { createClient, type Session } from "@aura-stack/auth"
import { api } from "~/auth"

const client = (request: Request) => {
    const baseURL = new URL(request.url).origin
    const headers: Record<string, string> = {}
    const cookie = request.headers.get("cookie")
    if (cookie) {
        headers.cookie = cookie
    }

    return createClient({
        baseURL,
        basePath: "/auth",
        cache: "no-store",
        credentials: "include",
        headers,
    })
}

export const getCSRFToken = async (request: Request): Promise<string | null> => {
    try {
        const response = await client(request).get("/csrfToken")
        if (!response.ok) return null
        const json = await response.json()
        return json && json?.csrfToken ? json.csrfToken : null
    } catch (error) {
        console.log("[error:server] getCSRFToken", error)
        return null
    }
}

export const getSession = async (request: Request): Promise<Session | null> => {
    try {
        const session = await api.getSession({
            headers: request.headers,
        })
        if (!session.authenticated) return null
        return session.session
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
        const response = await api.signOut({
            redirectTo,
            headers: request.headers,
        })
        if (response.status === 202) {
            return redirect(redirectTo, {
                headers: response.headers,
            })
        }
        const json = await response.json()
        return json
    } catch (error) {
        console.log("[error:server] signOut", error)
        return null
    }
}
