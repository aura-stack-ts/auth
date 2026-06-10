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
    SignUpOptions,
    SignUpReturn,
} from "@/@types/index.ts"

export type { AuthClientOptions }

export const createClient = createClientAPI<AuthClient>

export const createAuthClient = <
    DefaultUser extends User = User,
    SignUpPayload extends Record<string, any> = Record<string, any>,
>(
    options: AuthClientOptions
) => {
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

    /**
     * Gets the current session for the authenticated user.
     *
     * @returns Session object if the user is authenticated, or null if not authenticated or an error occurs.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const session = await authClient.getSession()
     */
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

    /**
     * Initiates the sign-in process for a specified OAuth provider.
     *
     * @param oauth The OAuth provider identifier (e.g., "google", "github").
     * @param options Optional sign-in options, including redirect behavior and target URL.
     * @returns An object containing the sign-in result, including success status and redirect URL if applicable.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const output = await authClient.signIn("google", {
     *   redirect: true,
     *   redirectTo: "/dashboard"
     * })
     */
    const signIn = async <Options extends SignInOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ): Promise<SignInReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const response = await client.get("/signIn/:oauth", {
                params: {
                    oauth,
                },
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.signInURL) {
                window.location.assign(json.signInURL)
            }
            return json as unknown as SignInReturn<Options>
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { success: false, redirect: false, signInURL: "/" } as unknown as SignInReturn<Options>
        }
    }

    /**
     * Initiates the sign-in process using user credentials (e.g., email and password).
     *
     * @param options Sign-in options, including the credentials payload and redirect behavior.
     * @returns An object containing the sign-in result, including success status and redirect URL if applicable.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const output = await authClient.signInCredentials({
     *   payload: {
     *     email: "user@example.com",
     *     password: "securepassword"
     *   }
     * })
     */
    const signInCredentials = async <Options extends SignInCredentialsOptions>(
        options: Options
    ): Promise<SignInCredentialsReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const response = await client.post("/signIn/credentials", {
                body: options.payload,
                // @ts-ignore - Fix type here - go to @aura-stack/router.
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignInCredentialsReturn<Options>
        } catch (error) {
            console.error("Error during credentials sign-in:", error)
            return { success: false, redirectURL: null } as unknown as SignInCredentialsReturn<Options>
        }
    }

    /**
     * Initiates the sign-up process for a new user with the provided payload.
     *
     * @param options Sign-up options, including the payload for user registration and redirect behavior.
     * @return An object containing the sign-up result, including success status and redirect URL if applicable.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const output = await authClient.signUp({
     *   payload: {
     *     name: "John Doe",
     *     email: "john@example.com",
     *     password: "securepassword"
     *   },
     * })
     */
    const signUp = async <Options extends SignUpOptions<SignUpPayload>>(options: Options): Promise<SignUpReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const response = await client.post("/signUp", {
                // @ts-ignore - Fix type here - go to @aura-stack/router.
                body: options.payload,
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignUpReturn<Options>
        } catch (error) {
            console.error("Error during sign-up:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as SignUpReturn<Options>
        }
    }

    /**
     * Updates the current session with new information, such as user data or expiration time.
     *
     * @param options Update session options, including the new session data and redirect behavior.
     * @returns An object containing the update session result, including success status and redirect URL if applicable.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const output = await authClient.updateSession({
     *   session: {
     *     user: {
     *       name: "John Doe"
     *     }
     *   }
     * })
     */
    const updateSession = async <Options extends UpdateSessionOptions<DefaultUser>>(
        options: Options
    ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for session update.")
            }
            const { session, redirectTo } = options ?? {}
            if (!session) {
                return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
            }
            const user = session.user ?? {}
            const response = await client.patch("/session", {
                // @ts-ignore - Fix type here - go to @aura-stack/router.
                body: {
                    // @ts-ignore - Fix type here - go to @aura-stack/router.
                    user,
                    expires: session.expires ? new Date(session.expires) : undefined,
                },
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as UpdateSessionReturn<Options, DefaultUser>
        } catch (error) {
            console.error("Error updating session:", error)
            return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
        }
    }

    /**
     * Signs out the current user, ending their session and optionally redirecting them to a specified URL.
     *
     * @param options Sign-out options, including redirect behavior and target URL after sign-out.
     * @returns An object containing the sign-out result, including success status and redirect URL if applicable.
     * @example
     * const authClient = createAuthClient({ ... })
     *
     * const output = await authClient.signOut({
     *   redirect: true,
     *   redirectTo: "/goodbye"
     * })
     */
    const signOut = async <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
        try {
            const csrfToken = await getCSRFToken()
            if (!csrfToken) {
                throw new AuthClientError("Failed to fetch CSRF token for sign-out.")
            }

            // @ts-ignore - Fix type here - go to @aura-stack/router.
            const response = await client.post("/signOut", {
                searchParams: {
                    redirectTo: options?.redirectTo,
                    redirect: false,
                    token_type_hint: "session_token",
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
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
        signUp,
        updateSession,
        signOut,
    }
}
