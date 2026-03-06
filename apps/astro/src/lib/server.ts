import type { AuthServerContext } from "@/@types/types"
import { api } from "@/auth"
import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

export const createAuthServer = async (context: AuthServerContext) => {
    const { request, redirect } = context

    const client = createClient({
        baseURL: new URL(request.url).origin,
        basePath: "/api/auth",
        cache: "no-store",
        credentials: "include",
        headers: {
            ...Object.fromEntries(request.headers.entries()),
            cookie: request.headers.get("cookie") ?? "",
        },
    })

    const getCSRFToken = async (): Promise<string | null> => {
        try {
            const response = await client.get("/csrfToken")
            if (!response.ok) return null
            const json = await response.json()
            return json && json?.csrfToken ? json.csrfToken : null
        } catch (error) {
            console.log("[error:server] getCSRFToken", error)
            return null
        }
    }

    const getSession = async (): Promise<Session | null> => {
        try {
            const session = await api.getSession({
                headers: request.headers,
            })
            if (!session.authenticated) return null
            return session.session
        } catch (error) {
            console.log("[error:server] getSession", error)
            return null
        }
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
        return redirect(`/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
    }

    const signOut = async (redirectTo: string = "/") => {
        try {
            const response = await api.signOut({
                redirectTo,
                headers: request.headers,
            })
            if (response.status === 202) {
                return response
            }
            const json = await response.json()
            return json
        } catch (error) {
            console.log("[error:server] signOut", error)
            return null
        }
    }

    return {
        getCSRFToken,
        getSession,
        signIn,
        signOut,
    }
}
