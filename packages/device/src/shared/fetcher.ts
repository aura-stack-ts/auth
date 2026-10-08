/**
 * Fetches a resource with a timeout mechanism.
 *
 * @param url - The URL or Request object to fetch
 * @param options - Optional RequestInit configuration object
 * @param timeout - Timeout duration in milliseconds (default: 5000ms)
 * @returns A promise that resolves to the Response object
 * @throws {DOMException} Throws AbortError when the timeout is reached
 * @example
 * const response = await fetcher('https://api.example.com/data', {}, 3000);
 */
export const fetcher = async (url: string | Request, options: RequestInit = {}, timeout: number = 5000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    const onExternalAbort = () => controller.abort()

    if (options.signal) {
        if (options.signal.aborted) {
            controller.abort()
        }
        options.signal.addEventListener("abort", onExternalAbort, { once: true })
    }

    const response = await fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => {
        clearTimeout(timeoutId)
        options.signal?.removeEventListener("abort", onExternalAbort)
    })
    return response
}

export const toFormBody = (params: Record<string, string>): URLSearchParams => {
    return new URLSearchParams(params)
}

export const toHeaders = (extra?: HeadersInit): HeadersInit => ({
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    ...extra,
})
