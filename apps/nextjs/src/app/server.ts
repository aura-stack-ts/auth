import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

const getBaseUrl = async () => {
    const headersStore = await headers()
    const host = headersStore.get("host") || "localhost:3000"
    const protocol = headersStore.get("x-forwarded-proto") || "http"
    return `${protocol}://${host}`
}

const getCSRFToken = async () => {
    const baseUrl = await getBaseUrl()
    const headersStore = await headers()
    const csrfResponse = await fetch(`${baseUrl}/auth/csrfToken`, {
        method: "GET",
        headers: headersStore,
        cache: "no-store",
    })
    const csrfData = await csrfResponse.json()
    return csrfData.csrfToken
}

export const useAuth = async () => {
    try {
        const baseUrl = await getBaseUrl()
        const headersStore = new Headers(await headers())
        const cookiesStore = await cookies()
        headersStore.set("Cookie", cookiesStore.toString())
        const session = await fetch(`${baseUrl}/auth/session`, {
            headers: headersStore,
            cache: "no-store",
        })
        const response = await session.json()
        return response
    } catch {
        return {
            message: "Unnauthorized",
            authenticated: false,
        }
    }
}

/**
 * @todo: implement a proper cookie management. It includes the name of the cookies
 */
export const signOut = async () => {
    "use server"
    const baseUrl = await getBaseUrl()
    const csrf = await getCSRFToken()
    const cookieStore = await cookies()
    const signOutResponse = await fetch(`${baseUrl}/auth/signOut?token_type_hint=session_token`, {
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
        cookieStore.delete("aura-auth.session_token")
        cookieStore.delete("aura-auth.csrf_token")
        redirect("/")
    }
    return response
}
