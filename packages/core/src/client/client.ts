import { AuthClientError, isNativeError } from "@/shared/errors.ts"
import { createClient as createClientAPI } from "@aura-stack/router"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    AuthClientOptions,
    AuthClient,
    SignInOptions,
    SignOutOptions,
    User,
    DeepPartial,
    CredentialsPayload,
} from "@/@types/index.ts"

export const createClient = createClientAPI<AuthClient>

export const createAuthClient = <DefaultUser extends User = User>(options: AuthClientOptions) => {
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

    const getSession = async (): Promise<Session<DefaultUser> | null> => {
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
                    ...options,
                    redirect: false,
                },
            })
            const json = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.signInURL) {
                window.location.assign(json.signInURL)
            }
            return json
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { redirect: false, signInURL: "/" }
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for sign-out.")
            }

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
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.url) {
                window.location.assign(json.url)
            }
            return json
        } catch (error) {
            console.error("Error during sign-out:", error)
            throw isNativeError(error)
                ? error
                : new AuthClientError("Sign-out failed.", "The sign-out request failed.", { cause: error })
        }
    }

    const updateSession = async (session: DeepPartial<Session<DefaultUser>>) => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for sign-out.")
            }
            const { sub: _sub, ...spread } = (session.user ?? {}) as DefaultUser
            const response = await client.patch("/session", {
                body: {
                    /** @todo: Remove the `as any` cast once the session update endpoint is properly typed to accept partial session updates. */
                    ...(spread as any),
                    expires: session.expires,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            if (!response.ok) {
                return { session: null, updated: false }
            }
            const json = await response.json()
            return json
        } catch (error) {
            console.error("Error updating session:", error)
            throw isNativeError(error)
                ? error
                : new AuthClientError("Session update failed.", "The session update request failed.", { cause: error })
        }
    }

    const signInCredentials = async (credentials: CredentialsPayload, options?: SignInOptions) => {
        try {
            const response = await client.post("/signIn/credentials", {
                body: credentials,
                searchParams: {},
            })
            const json = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.signInURL) {
                window.location.assign(json.signInURL)
            }
            return json
        } catch (error) {
            console.error("Error during credentials sign-in:", error)
            return { success: false, redirectURL: null }
        }
    }

    return {
        getSession,
        signIn,
        signInCredentials,
        signOut,
        updateSession,
    }
}
