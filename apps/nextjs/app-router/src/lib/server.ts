"use server"

import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"
import { api } from "@/auth"

const toHeaders = (incoming: Awaited<ReturnType<typeof headers>>) => {
    return Object.fromEntries(incoming.entries())
}

/**
 * @todo: fix bug related to rendered statically
 * @see https://nextjs.org/docs/messages/dynamic-server-error
 */
const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.AUTH_URL ?? "http://localhost:3000"),
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string | null> => {
    try {
        const response = await client.get("/csrfToken", {
            headers: toHeaders(await headers()),
        })
        if (!response.ok) return null
        const json = await response.json()
        return json && json?.csrfToken ? json.csrfToken : null
    } catch (error) {
        console.log("[error:server] getCSRFToken", error)
        return null
    }
}

export const getSession = async (): Promise<Session | null> => {
    try {
        const session = await api.getSession({
            headers: await headers(),
        })
        if (!session.authenticated) {
            return null
        }
        return session.session
    } catch {
        console.log("[error:server] getSession - Failed to retrieve session")
        return null
    }
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    "use server"
    return redirect(`/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
}

export const signOut = async (redirectTo: string = "/") => {
    try {
        const cookieStore = await cookies()
        const response = await api.signOut({
            headers: await headers(),
        })
        if (response.status === 202) {
            const setCookies = response.headers.getSetCookie()
            for (const cookie of setCookies) {
                const nameMatch = cookie.match(/^([^=]+)=/)
                nameMatch && cookieStore.delete(nameMatch[1])
            }
            redirect(redirectTo)
        }
        return response.json()
    } catch (error) {
        console.log("[error:server] signOut", error)
    }
}
