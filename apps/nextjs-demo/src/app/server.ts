import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { Session } from "@aura-stack/auth/types"

const getCSRFToken = async () => {
    const headersStore = await headers()
    const csrfResponse = await fetch("http://localhost:3000/auth/csrfToken", {
        method: "GET",
        headers: headersStore,
        cache: "no-store",
    })
    const csrfData = await csrfResponse.json()
    return csrfData.csrfToken
}

export const useAuth = async () => {
    const headersStore = new Headers(await headers())
    const cookiesStore = await cookies()
    headersStore.set("Cookie", cookiesStore.toString())
    const session = await fetch("http://localhost:3000/auth/session", {
        headers: headersStore,
        cache: "no-store",
    })
    const response = await session.json()
    return response as Session
}

export const signOut = async () => {
    "use server"
    const csrf = await getCSRFToken()
    const cookieStore = await cookies()
    const signOutResponse = await fetch("http://localhost:3000/auth/signOut?token_type_hint=session_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
            Cookie: cookieStore.toString(),
        },
        body: JSON.stringify({}),
        cache: "no-store",
    })
    const response = await signOutResponse.json()
    if (signOutResponse.status === 202) {
        cookieStore.delete("aura-auth.sessionToken")
        cookieStore.delete("aura-auth.csrfToken")
        redirect("/")
    }
    return response
}
