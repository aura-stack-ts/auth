import { createClient } from "@aura-stack/auth"
import { createServerFn } from "@tanstack/react-start"
import { getCookies, getRequest, getRequestHeaders, setResponseHeaders } from "@tanstack/react-start/server"

const getBaseURL = (request: Request) => {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
}

const client = () => {
    const request = getRequest()
    return createClient({
        baseURL: getBaseURL(request),
        basePath: "/auth",
        cache: "no-store",
        credentials: "include",
        headers: async () => {
            const cookies = getCookies()
            const headers = getRequestHeaders()
            const cookieStr = cookiesToString(cookies)
            return {
                ...Object.fromEntries(headers.entries()),
                cookie: cookieStr,
            }
        },
    })
}

const cookiesToString = (cookies: Record<string, string | undefined>) => {
    return Object.entries(cookies)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ")
}

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    try {
        const response = await client().get("/session")
        if (!response.ok) return null
        const session = await response.json()
        return session && session?.user ? session : null
    } catch (error) {
        console.log("[error:server] getSession", error)
        return null
    }
})

export const getCsrfToken = createServerFn({ method: "GET" }).handler(async () => {
    try {
        const response = await client().get("/csrfToken")
        if (!response.ok) return null
        const json = await response.json()
        return json && json?.csrfToken ? json.csrfToken : null
    } catch (error) {
        console.log("[error:server] getCsrfToken", error)
        return null
    }
})

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            console.error("[error:server] signOut - No CSRF token")
            return null
        }
        const response = await client().post("/signOut", {
            searchParams: {
                token_type_hint: "session_token",
            },
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
        setResponseHeaders(response.headers)
        const json = await response.json()
        return json
    } catch (error) {
        console.log("[error:server] signOut", error)
    }
})
