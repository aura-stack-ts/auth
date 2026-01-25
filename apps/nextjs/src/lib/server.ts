import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { createRequest, getBaseURLServer } from "./request"
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

export const getSession = async () => {
    const cookiesStore = await cookies()
    const response = await createRequest("/auth/session", {
        headers: { Cookie: cookiesStore.toString() },
    })
    const session = (await response.json()) as Session
    return session
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    "use server"
    const baseURL = await getBaseURLServer()
    return Response.redirect(`${baseURL}/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`, 302)
}

export const signOut = async () => {
    "use server"
    const csrfToken = await getCSRFToken()
    const cookieStore = await cookies()
    const response = await createRequest("/auth/signOut?token_type_hint=session_token", {
        method: "POST",
        headers: {
            Cookie: cookieStore.toString(),
            "X-CSRF-Token": csrfToken,
        },
    })
    if (response.status === 202) {
        const setCookies = response.headers.getSetCookie()
        for (const cookie of setCookies) {
            const [nameValue] = cookie.split("; ")
            cookieStore.set(nameValue.split("=")[0], "")
        }
        redirect("/")
    }
    return response.json()
}

/**
 * @experimental
 */
export const createAuthServer = () => {
    return {
        getSession,
        signIn,
        signOut,
    }
}
