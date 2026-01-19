import { createServerFn } from "@tanstack/react-start"
import { getCookies, getRequest, getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server"

const getBaseURL = (request: Request) => {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
}

export const getSessionServer = async (request: Request, cookies: string) => {
    const baseURL = getBaseURL(request)
    const response = await fetch(`${baseURL}/auth/session`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookies },
    })
    const session = await response.json()
    return session
}

export const getCsrfTokenServer = async (request: Request, headers: HeadersInit) => {
    const baseURL = getBaseURL(request)
    const response = await fetch(`${baseURL}/auth/csrfToken`, {
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
    const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ")
    const session = await getSessionServer(request, cookieStr)
    return session
})

export const getCsrfToken = createServerFn({ method: "GET" }).handler(async () => {
    const request = getRequest()
    const headers = getRequestHeaders()
    const csrfToken = await getCsrfTokenServer(request, headers)
    return csrfToken
})

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
    const request = getRequest()
    const baseURL = getBaseURL(request)
    const csrfToken = await getCsrfTokenServer(request, getRequestHeaders())
    const cookies = getCookies()
    const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ")
    const response = await fetch(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
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
