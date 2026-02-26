import { LiteralUnion } from "@aura-stack/auth/types"
import { createClient, type Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

const client = createClient({
    baseURL: "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const getCSRFToken = async (): Promise<string> => {
    const response = await client.get("/csrfToken")
    const data = await response.json()
    return data.csrfToken
}

export const getSession = async (): Promise<Session | null> => {
    const response = await client.get("/session")
    const session = await response.json()
    return session
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, redirectTo: string = "/") => {
    await client.get("/signIn/:oauth", { 
        params: { oauth: provider }, 
        searchParams: { redirectTo } }
    )
}

export const signOut = async (redirectTo: string = "/") => {
    const csrfToken = await getCSRFToken()
    const response = await client.post(
        "/signOut",
        {
            searchParams: {
                token_type_hint: "session_token",
                redirectTo,
            },
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        }
    )
    const session = await response.json()
    return session
}