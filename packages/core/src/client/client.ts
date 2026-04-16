import { AuthClientError } from "@/shared/errors.ts"
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
    CredentialsPayload,
    UpdateSessionOptions,
    SignInReturn,
    SignOutReturn,
    UpdateSessionReturn,
    SignInCredentialsReturn,
    SignInAPIReturn,
    SignOutAPIReturn,
    SignInCredentialsAPIReturn,
    UpdateSessionAPIReturn,
} from "@/@types/index.ts"

export type { AuthClientOptions }

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
            const data: { csrfToken?: string } = await response.json()
            return data.csrfToken ?? null
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
            if (!session.success) return null
            return session.session
        } catch (error) {
            console.error("Error fetching session:", error)
            return null
        }
    }

    const signIn = async <Redirect extends boolean = true>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: SignInOptions<Redirect>
    ): Promise<SignInReturn<Redirect>> => {
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
            const json = (await response.json()) as SignInAPIReturn
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.signInURL) {
                window.location.assign(json.signInURL)
            }
            return json as unknown as SignInReturn<Redirect>
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { success: false, redirect: false, signInURL: "/" } as SignInReturn<Redirect>
        }
    }

    const signOut = async <Redirect extends boolean = true>(
        options?: SignOutOptions<Redirect>
    ): Promise<SignOutReturn<Redirect>> => {
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
            const json: SignOutAPIReturn = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignOutReturn<Redirect>
        } catch (error) {
            console.error("Error during sign-out:", error)
            return { success: false, redirect: false, redirectURL: "/" } as SignOutReturn<Redirect>
        }
    }

    const updateSession = async (session: UpdateSessionOptions<DefaultUser>): Promise<UpdateSessionReturn<DefaultUser>> => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for session update.")
            }
            const user = session.user ?? {}
            const response = await client.patch("/session", {
                body: {
                    user,
                    expires: session.expires ? new Date(session.expires) : undefined,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            if (!response.ok) {
                return { session: null, success: false }
            }
            const json: UpdateSessionAPIReturn<DefaultUser> = await response.json()
            return json
        } catch (error) {
            console.error("Error updating session:", error)
            return { success: false, session: null }
        }
    }

    const signInCredentials = async (
        credentials: CredentialsPayload,
        options?: SignInOptions
    ): Promise<SignInCredentialsReturn> => {
        try {
            const response = await client.post("/signIn/credentials", {
                body: credentials,
                searchParams: {
                    redirectTo: options?.redirectTo,
                },
            })
            const json: SignInCredentialsAPIReturn = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
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
