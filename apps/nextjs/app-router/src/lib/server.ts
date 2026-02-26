"use server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

const client = createClient({
    baseURL: "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
    headers: async () => {
        "use server"
        const headersStore = await headers()
        return Object.fromEntries(headersStore.entries())
    },
})

export const getCSRFToken = async () => {
    try {
        const response = await client.get("/csrfToken")
        if (!response.ok) return null
        const json = await response.json()
        return json.csrfToken
    } catch (error) {
        console.log("[error:server] getCSRFToken", error)
        return null
    }
}

export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await client.get("/session")
        if (!response.ok) return null
        const session = await response.json()
        return session && session?.user ? session : null
    } catch (error) {
        console.log("[error:server] getSession", error)
        return null
    }
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    "use server"
    return redirect(`/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
}

export const signOut = async (redirectTo: string = "/") => {
    try {
        const cookiesStore = await cookies()
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
        if (response.status === 202) {
            const setCookies = response.headers.getSetCookie()
            for (const cookie of setCookies) {
                const [nameValue] = cookie.split("; ")
                cookiesStore.set(nameValue.split("=")[0], "")
            }
            redirect(redirectTo)
        }
        return response.json()
    } catch (error) {
        console.log("[error:server] signOut", error)
    }
}
