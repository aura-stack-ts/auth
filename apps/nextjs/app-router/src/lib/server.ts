"use server"

import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers"

const toHeaders = (headers: ReadonlyHeaders) => {
    return Object.fromEntries(headers.entries())
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
    "use server"
    try {
        const response = await client.get("/session", {
            headers: toHeaders(await headers()),
        })
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
        if (!csrfToken) {
            console.log("[error:server] signOut - No CSRF token")
            return null
        }
        const response = await client.post("/signOut", {
            searchParams: {
                redirectTo,
                token_type_hint: "session_token",
            },
            headers: {
                "X-CSRF-Token": csrfToken,
                ...toHeaders(await headers()),
            },
        })
        if (response.status === 202) {
            const setCookies = response.headers.getSetCookie()
            for (const cookie of setCookies) {
                const nameMatch = cookie.match(/^([^=]+)=/)
                nameMatch && cookiesStore.delete(nameMatch[1])
            }
            redirect(redirectTo)
        }
        return response.json()
    } catch (error) {
        console.log("[error:server] signOut", error)
    }
}
