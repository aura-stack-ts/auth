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
    UpdateSessionOptions,
    SignInReturn,
    SignOutReturn,
    UpdateSessionReturn,
    SignInCredentialsReturn,
    SignInCredentialsOptions,
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
            return session.session as Session<DefaultUser>
        } catch (error) {
            console.error("Error fetching session:", error)
            return null
        }
    }

    const signIn = async <Options extends SignInOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ): Promise<SignInReturn<Options>> => {
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
            return json as unknown as SignInReturn<Options>
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { success: false, redirect: false, signInURL: "/" } as unknown as SignInReturn<Options>
        }
    }

    const signInCredentials = async <Options extends SignInCredentialsOptions>(
        options: Options
    ): Promise<SignInCredentialsReturn<Options>> => {
        try {
            const response = await client.post("/signIn/credentials", {
                body: options.payload,
                searchParams: {
                    redirectTo: options?.redirectTo,
                },
            })
            const json = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignInCredentialsReturn<Options>
        } catch (error) {
            console.error("Error during credentials sign-in:", error)
            return { success: false, redirectURL: null } as unknown as SignInCredentialsReturn<Options>
        }
    }

    const updateSession = async <Options extends UpdateSessionOptions<DefaultUser>>(
        options: Options
    ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for session update.")
            }
            const { session } = options ?? {}
            if (!session) {
                return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
            }
            const user = session.user ?? {}
            const response = await client.patch("/session", {
                // @ts-ignore - Fixing the type here - go to @aura-stack/router.
                body: {
                    user,
                    expires: session.expires ? new Date(session.expires) : undefined,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await response.json()
            if ((options.redirect ?? true) && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as UpdateSessionReturn<Options, DefaultUser>
        } catch (error) {
            console.error("Error updating session:", error)
            return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
        }
    }

    const signOut = async <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for sign-out.")
            }

            const response = await client.post("/signOut", {
                searchParams: {
                    redirectTo: options?.redirectTo,
                    token_type_hint: "session_token",
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await response.json()
            if ((options?.redirect ?? true) && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignOutReturn<Options>
        } catch (error) {
            console.error("Error during sign-out:", error)
            return { success: false, redirect: false, redirectURL: "/" } as unknown as SignOutReturn<Options>
        }
    }

    return {
        getSession,
        signIn,
        signInCredentials,
        updateSession,
        signOut,
    }
}
