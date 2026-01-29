import { createRequest } from "./request"
import type { Session } from "@aura-stack/auth"
import type { LiteralUnion } from "@aura-stack/auth/types"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const createAuthServer = async (context: {
    request: Request
    cookies: any
    redirect: (path: string, status?: number) => any
}) => {
    const { request, redirect } = context

    const getCSRFToken = async () => {
        const response = await createRequest("/api/auth/csrfToken", {
            headers: Object.fromEntries(request.headers.entries()),
        })
        const json = await response.json()
        return json.csrfToken
    }

    const getSession = async (): Promise<Session | null> => {
        const response = await createRequest(`/api/auth/session`, {
            headers: {
                ...Object.fromEntries(request.headers.entries()),
                Cookie: request.headers.get("cookie") || "",
            },
        })
        const session = (await response.json()) as Session
        return session
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
        return redirect(`/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
    }

    const signOut = async (redirectTo: string = "/") => {
        const csrfToken = await getCSRFToken()
        const response = await createRequest(
            `/api/auth/signOut?token_type_hint=session_token&redirectTo=${encodeURIComponent(redirectTo)}`,
            {
                method: "POST",
                headers: {
                    ...Object.fromEntries(request.headers.entries()),
                    Cookie: request.headers.get("cookie") || "",
                    "X-CSRF-Token": csrfToken,
                },
            }
        )
        if (response.status === 202) {
            redirect(redirectTo)
        }
        return response.json()
    }

    return {
        getSession,
        signIn,
        signOut,
    }
}
