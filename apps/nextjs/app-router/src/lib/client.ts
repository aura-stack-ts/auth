import { createClient, type Session, type LiteralUnion, type BuiltInOAuthProvider } from "@aura-stack/auth"

const client = createClient({
    baseURL: "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string | null> => {
    const response = await client.get("/csrfToken")
    if (!response.ok) return null
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    if (!response.ok) return null
    const session = await response.json()
    return session && session?.user ? session : null
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    await client.get("/signIn/:oauth", {
        params: { oauth: provider },
        searchParams: { redirectTo },
    })
}

export const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    await client.post("/signOut", {
        searchParams: {
            token_type_hint: "session_token",
            redirectTo,
        },
        headers: {
            "X-CSRF-Token": csrfToken!,
        },
    })
}
