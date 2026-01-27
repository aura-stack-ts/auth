import type { NextApiRequest } from "next"
import type { Session } from "@aura-stack/auth"
import { IncomingMessage } from "http"


export const getBaseURL = (request: NextApiRequest | IncomingMessage) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
}

export const getSession = async (request: IncomingMessage): Promise<Session | null> => {
    const baseURL = getBaseURL(request)
    const headers = new Headers(request.headers as Record<string, string>)
    const response = await fetch(`${baseURL}/api/auth/session`, {
        headers,
    })
    const session = (await response.json()) as Session
    return session
}


const signOut = async (redirectTo: string = "/") => {
    /*
    const cookiesStore = await cookies()
    const headersStore = await headers()
    const csrfToken = await getCSRFToken()
    const response = await createRequest(
        `/api/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
        {
            method: "POST",
            headers: {
                ...Object.fromEntries(headersStore.entries()),
                Cookie: cookiesStore.toString(),
                "X-CSRF-Token": csrfToken,
            },
        }
    )
    if (response.status === 202) {
        const setCookies = response.headers.getSetCookie()
        for (const cookie of setCookies) {
            const [nameValue] = cookie.split("; ")
            cookiesStore.set(nameValue.split("=")[0], "")
        }
        redirect(redirectTo)
    }
    return response.json()
    */
    return null
}
