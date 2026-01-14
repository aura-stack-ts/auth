import { redirect } from "react-router"

/**
 * @todo: This function must be accepted when the `trustedProxyHeaders` is enabled in
 * `createAuth` function from `@aura-stack/auth` package.
 */
export const getBaseUrl = (headers: Headers) => {
    const host = headers.get("host") || "localhost:3000"
    const protocol = headers.get("x-forwarded-proto") || "http"
    return `${protocol}://${host}`
}

export const getCSRFToken = async (request: Request) => {
    const baseURL = getBaseUrl(request.headers)
    const response = await fetch(`${baseURL}/auth/csrfToken`, {
        method: "GET",
        headers: request.headers,
        cache: "no-store",
    })
    const token = await response.json()
    return token.csrfToken
}

export const signOut = async (request: Request) => {
    const baseURL = getBaseUrl(request.headers)
    const csrfToken = await getCSRFToken(request)
    const response = await fetch(`${baseURL}/auth/signOut?token_type_hint=session_token`, {
        method: "POST",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
        },
        body: JSON.stringify({}),
        cache: "no-store",
    })
    const json = await response.json()
    if (response.status === 202) {
        return redirect("/", {
            headers: response.headers,
        })
    }
    return json
}

export const getSession = async (request: Request) => {
    const baseURL = getBaseUrl(request.headers)
    const response = await fetch(`${baseURL}/auth/session`, {
        headers: request.headers,
        cache: "no-store",
    })
    const session = await response.json()
    return session
}
