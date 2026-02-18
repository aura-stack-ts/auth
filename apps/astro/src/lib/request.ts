export const getBaseURLServer = async (headers: Headers) => {
    const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:4321"
    const protocol = headers.get("x-forwarded-proto") || "http"
    return `${protocol}://${host}`
}

export const createRequest = async (endpoint: string, init?: RequestInit, timeout: number = 5000) => {
    const isServer = typeof window === "undefined"
    const baseURL = isServer ? await getBaseURLServer(new Headers(init?.headers)) : window.location.origin
    const { method = "GET", headers, body, ...options } = init ?? {}
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        method,
        signal: controller.signal,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: method === "GET" || !body ? undefined : JSON.stringify(body),
        cache: "no-store",
        credentials: "include",
    }).finally(() => clearTimeout(timeoutId))
    return response
}
