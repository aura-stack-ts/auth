"use server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createClient, type Session } from "@aura-stack/auth"
import type { LiteralUnion } from "@aura-stack/auth/types"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

const client = createClient({
    baseURL: "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
    headers: async () => {
        "use server"
        const headersStore = await headers()
        return Object.fromEntries(headersStore.entries())
    }
})

export const getCSRFToken = async () => {
    const response = await client.get("/csrfToken")
    const json = await response.json()
    return json.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    const session = await response.json()
    return session
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    "use server"
    return redirect(`/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
}

export const signOut = async (redirectTo: string = "/") => {
    const cookiesStore = await cookies()
    const csrfToken = await getCSRFToken()
    const response = await client.post("/signOut", {
        searchParams: {
            redirectTo,
            token_type_hint: "session_token",
        },
        headers: {
            "X-CSRF-Token": csrfToken,
        }
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
}