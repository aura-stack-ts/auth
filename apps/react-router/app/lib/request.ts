export const createRequest = async (url: string, init?: RequestInit, timeout: number = 5000) => {
    const { method = "GET", headers, body = {}, ...options } = init ?? {}
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(url, {
        ...options,
        method,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...headers,
            Cookie:
                headers instanceof Headers ? (headers.get("Cookie") ?? "") : ((headers as Record<string, string>)?.Cookie ?? ""),
        },
        body: method === "GET" ? undefined : JSON.stringify(body),
        cache: "no-store",
        credentials: "include",
    }).finally(() => clearTimeout(timeoutId))
    return response
}
