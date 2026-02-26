import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

export const createAuthServer = async (context: {
    request: Request
    redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308 | 300 | 304) => Response
}) => {
    const { request, redirect } = context

    const client = createClient({
        baseURL: "http://localhost:3000",
        basePath: "/api/auth",
        cache: "no-store",
        credentials: "include",
        headers: {
            ...Object.fromEntries(request.headers.entries()),
            cookie: request.headers.get("cookie") ?? "",
        },
    })

    const getCSRFToken = async () => {
        const response = await client.get("/csrfToken")
        const json = await response.json()
        return json.csrfToken
    }

    const getSession = async (): Promise<Session | null> => {
        const response = await client.get("/session")
        const session = await response.json() as Session
        if (!session || !session.user) return null
        return session
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
        return redirect(`/api/auth/signIn/${provider}?${new URLSearchParams({ redirectTo }).toString()}`)
    }

    const signOut = async (redirectTo: string = "/") => {
        const csrfToken = await getCSRFToken()
        const response = await client.post("/signOut", {
            searchParams: {
                redirectTo,
                token_type_hint: "session_token"
            },
            headers: {
                "X-CSRF-Token": csrfToken
            }
        })
        if (response.status === 202) {
            return redirect(redirectTo)
        }
        return response.json()
    }

    return {
        getCSRFToken,
        getSession,
        signIn,
        signOut,
    }
}
