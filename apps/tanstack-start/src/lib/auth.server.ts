import { createServerFn } from "@tanstack/react-start"
import { getCookies, getRequest, getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server"
import { AUTH_API_ENDPOINTS } from "./constants"
import type { Session } from "@aura-stack/auth"

const getBaseURL = (request: Request) => {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
}

const cookiesToString = (cookies: Record<string, string | undefined>) => {
    return Object.entries(cookies)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ")
}

export const getSessionRequest = async (request: Request, cookies: string): Promise<Session | null> => {
    const baseURL = getBaseURL(request)
    const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.SESSION}`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookies },
    })
    if (!response.ok) {
        return null
    }
    const session = await response.json()
    return session
}

export const getCsrfTokenRequest = async (request: Request, headers: HeadersInit) => {
    const baseURL = getBaseURL(request)
    const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.CSRF_TOKEN}`, {
        method: "GET",
        cache: "no-store",
        headers,
    })
    const json = await response.json()
    return json.csrfToken
}

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    const request = getRequest()
    const cookies = getCookies()
    const cookieStr = cookiesToString(cookies)
    const session = await getSessionRequest(request, cookieStr)
    return session
})

export const getCsrfToken = createServerFn({ method: "GET" }).handler(async () => {
    const request = getRequest()
    const headers = getRequestHeaders()
    const csrfToken = await getCsrfTokenRequest(request, headers)
    return csrfToken
})

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
    const request = getRequest()
    const baseURL = getBaseURL(request)
    const csrfToken = await getCsrfTokenRequest(request, getRequestHeaders())
    const cookies = getCookies()
    const cookieStr = cookiesToString(cookies)

    const response = await fetch(`${baseURL}${AUTH_API_ENDPOINTS.SIGN_OUT}?token_type_hint=session_token`, {
        method: "POST",
        cache: "no-store",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
            Cookie: cookieStr,
        },
        body: JSON.stringify({}),
    })
    setResponseHeader("Set-Cookie", response.headers.getSetCookie())
})
