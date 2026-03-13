import { AuthClientError } from "@/errors.ts"
import { createClient as createClientAPI } from "@aura-stack/router"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    AuthClientOptions,
    AuthClient,
    SignInOptions,
    SignOutOptions,
} from "@/@types/index.ts"

export const createClient = createClientAPI<AuthClient>

export const createAuthClient = (options: AuthClientOptions) => {
    if (typeof window === "undefined" && !options.baseURL) {
        throw new AuthClientError("`baseURL` is required when createAuthClient is used outside the browser.")
    }

    const client = createClient({
        cache: "no-store",
        credentials: "include",
        baseURL: options.baseURL ?? window.location.origin,
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
                searchParams: {
                    redirectTo: options?.redirectTo,
                    redirect: false,
                },
            })
            const json = await response.json()
            if (options?.redirect && typeof window !== "undefined" && json?.url) {
                window.location.assign(json.url)
            }
            return json
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { redirect: false, url: "/" }
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) return { redirect: false, url: "/" }

            const response = await client.post("/signOut", {
                searchParams: {
                    redirectTo: options?.redirectTo ?? "/",
                    token_type_hint: "session_token",
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await response.json()
            if (options?.redirect && typeof window !== "undefined" && json?.url) {
                window.location.assign(json.url)
            }
            return json
        } catch (error) {
            console.error("Error during sign-out:", error)
            return { redirect: false, url: "/" }
        }
    }

    return {
        getSession,
        signIn,
        signOut,
    }
}
