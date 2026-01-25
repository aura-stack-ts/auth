import { headers } from "next/headers"

export const getBaseURLServer = async () => {
    "use server"
    const headersStore = await headers()
    const host = headersStore.get("host") || "localhost:3000"
    const protocol = headersStore.get("x-forwarded-proto") || "http"
    return `${protocol}://${host}`
}

export const createRequest = async (endpoint: string, init?: RequestInit, timeout: number = 5000) => {
    const isServer = typeof window === "undefined"
    const baseURL = isServer ? await getBaseURLServer() : window.location.origin
    const { method = "GET", headers, body = {}, ...options } = init ?? {}
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        method,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: method === "GET" ? undefined : JSON.stringify(body),
        cache: "no-store",
        credentials: "include",
    }).finally(() => clearTimeout(timeoutId))
    return response
}