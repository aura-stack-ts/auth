/**
 * Fetches a resource with a timeout mechanism.
 *
 * @param url - The URL or Request object to fetch
 * @param options - Optional RequestInit configuration object
 * @param timeout - Timeout duration in milliseconds (default: 5000ms)
 * @returns A promise that resolves to the Response object
 * @example
 * const response = await fetchAsync('https://api.example.com/data', {}, 3000);
 */
export const fetchAsync = async (url: string | Request, options: RequestInit = {}, timeout: number = 5000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))
    return response
}
