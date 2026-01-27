"use server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createRequest } from "./request"
import type { Session } from "@aura-stack/auth"
import type { LiteralUnion } from "@aura-stack/auth/types"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

const getCSRFToken = async () => {
    const headersStore = await headers()
    const csrfToken = await createRequest("/auth/csrfToken", {
        headers: Object.fromEntries(headersStore.entries()),
    })
    const json = await csrfToken.json()
    return json.csrfToken
}

const getSession = async (): Promise<Session | null> => {
    "use server"
    const cookiesStore = await cookies()
    const headersStore = await headers()
    const response = await createRequest(`/auth/session`, {
        headers: {
            ...Object.fromEntries(headersStore.entries()),
            Cookie: cookiesStore.toString(),
        },
    })
    const session = (await response.json()) as Session
    return session
}

const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    "use server"
    return redirect(`/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
}

const signOut = async (redirectTo: string = "/") => {
    "use server"
    const cookiesStore = await cookies()
    const headersStore = await headers()
    const csrfToken = await getCSRFToken()
    const response = await createRequest(
        `/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
        {
            method: "POST",
            headers: {
                ...Object.fromEntries(headersStore.entries()),
                Cookie: cookiesStore.toString(),
                "X-CSRF-Token": csrfToken,
            },
        }
    )
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

export const createAuthServer = async () => {
    return {
        getSession,
        signIn,
        signOut,
    }
}
