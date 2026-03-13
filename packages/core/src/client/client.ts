import type { createAuthInstance } from "@/createAuth.ts"
import { createClient as createClientAPI } from "@aura-stack/router"
import type { Session, LiteralUnion, BuiltInOAuthProvider, Prettify } from "@/@types/index.ts"
import type { ClientOptions } from "@aura-stack/router/types"

export const createClient = createClientAPI<AuthClient>

export type AuthClient = ReturnType<typeof createAuthInstance>["handlers"]
export type AuthClientOptions = Prettify<Omit<ClientOptions, "baseURL"> & {
    baseURL?: string
}>

export interface SignInOptions {
    redirectTo?: string
}

export interface SignOutOptions {
    redirectTo?: string
}

export const createAuthClient = (options: AuthClientOptions) => {
    const client = createClient({
        cache: "no-store",
        credentials: "include",        
        baseURL: options?.baseURL ?? "",
        ...options,
    })

    const getCSRFToken = async (): Promise<string | null> => {
        try {
            const response = await client.get("/csrfToken")
            if (!response.ok) return null
            const data = await response.json()
            return data.csrfToken
        } catch (error) {
            console.error("Error fetching CSRF token:", error)
            return null
        }
    }

    const getSession = async (): Promise<Session | null> => {
        try {
            const response = await client.get("/session")
            if (!response.ok) return null
            const session = await response.json()
            if (!session?.authenticated) return null
            return session.session
        } catch (error) {
            console.error("Error fetching session:", error)
            return null
        }
    }

    const signIn = async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: SignInOptions) => {
        try {
            const response = await client.get("/signIn/:oauth", {
                params: {
                    oauth,
                },
                searchParams: { redirectTo: options?.redirectTo }
            })
            return await response.json()
        } catch (error) {
            console.error("Error during sign-in:", error)
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) return { message: "Failed to sign out." }

            const response = await client.post("/signOut", {
                searchParams: {
                    redirectTo: options?.redirectTo ?? "/",
                    token_type_hint: "session_token",
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            return await response.json()
        } catch (error) {
            console.error("Error during sign-out:", error)
            return { message: "Failed to sign out." }
        }
    }

    return {
        getSession,
        signIn,
        signOut,
    }
}