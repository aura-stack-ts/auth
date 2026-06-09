import { getSession, signIn, signInCredentials, signOut, updateSession, signUp } from "@/api/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    GetSessionAPIOptions,
    GetSessionAPIReturn,
    SignInAPIOptions,
    SignInAPIReturn,
    SignOutAPIOptions,
    UpdateSessionAPIOptions,
    User,
    SignInCredentialsAPIOptions,
    SignInCredentialsAPIReturn,
    SignOutAPIReturn,
    UpdateSessionAPIReturn,
    SignUpAPIOptions,
    SignUpAPIReturn,
} from "@/@types/index.ts"

export const createAuthAPI = <
    DefaultUser extends User = User,
    SignUpPayload extends Record<string, unknown> = Record<string, unknown>,
>(
    ctx: GlobalContext
) => {
    return {
        /**
         * Retrieves the current session data from the server-side.
         *
         * @param options - Options for the API call, including headers to verify `session_token` cookie.
         * @returns An object containing session data see {@link User}
         */
        getSession: async (options: GetSessionAPIOptions): Promise<GetSessionAPIReturn<DefaultUser>> => {
            const session = await getSession<DefaultUser>({ ctx, headers: options.headers })
            return session
        },
        /**
         * Initiates the sign-in flow on the server-side. By default the redirect is automatic, but it can be
         * disabled by setting the `redirect` option to `false`. When redirect is disabled, the API returns the
         * `signInURL` in the response for the client to handle the redirect manually.
         *
         * @param oauth - The OAuth provider to use for sign-in (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the sign-in process, including headers and redirect behavior.
         * @returns The object returned by the API call {@link SignInAPIReturn}
         * @example
         * const response = await api.signIn("github", {
         *   redirectTo: "/dashboard",
         *   request: await getRequest(),
         * })
         */
        signIn: async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions): Promise<SignInAPIReturn> => {
            return signIn(oauth, { ctx, ...options })
        },
        /**
         * Signs in a user using credentials (`username` and `password`) on the server-side. The credentials must
         * be verified by the `authorize` function provided in the `credentials` configuration option.
         *
         * @param options - Options for the API call, including the credentials payload, headers, and redirect behavior.
         * @returns The object returned by the API call {@link SignInCredentialsAPIReturn}
         * @example
         * const response = await api.signInCredentials({
         *   payload: {
         *     username: "johndoe",
         *     password: "1234567890"
         *   },
         *   redirectTo: "/dashboard",
         *   request: await getRequest(),
         * })
         */
        signInCredentials: async (options: SignInCredentialsAPIOptions): Promise<SignInCredentialsAPIReturn> => {
            return signInCredentials({ ctx, ...options })
        },
        /**
         * Signs up a new user on the server-side. It requires a `payload` with the necessary information for
         * user creation and a callback function configured in `signUp.onCreateUser` to handle the actual user
         * creation logic.
         *
         * @params options - Options for the API call, including the sign-up payload, headers, and redirect behavior.
         * @return The object returned by the API call {@link SignUpAPIReturn}
         * @example
         * const response = await api.signUp({
         *   payload: {
         *     name: "John",
         *     lastName: "Doe",
         *     email: "john.doe@example.com",
         *     password: "1234567890"
         *   },
         *   redirectTo: "/dashboard",
         *   request: await getRequest()
         * })
         */
        signUp: async <Payload extends Record<string, unknown> = SignUpPayload>(
            options: SignUpAPIOptions<Payload>
        ): Promise<SignUpAPIReturn> => {
            return signUp({ ctx, ...options })
        },
        /**
         * Updates the current session on the server-side. It allows partial updates to the session object, such as
         * modifying user fields or extending the session expiry. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including the session updates, headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link UpdateSessionAPIReturn}
         * @example
         * const response = await api.updateSession({
         *   session: {
         *     user: {
         *       name: "John Doe",
         *       email: "john.doe@example.com"
         *     }
         *   },
         *   redirectTo: "/dashboard",
         *   request: await getRequest()
         * })
         */
        updateSession: async (options: UpdateSessionAPIOptions<DefaultUser>): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
            return updateSession<DefaultUser>({ ctx, ...options, skipCSRFCheck: true })
        },
        /**
         * Signs out the current session on the server-side. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link SignOutAPIReturn}
         * @example
         * const response = await api.signOut({
         *   redirectTo: "/goodbye",
         *   headers: {
         *     Cookie: "session_token=abc123; csrf_token=def456"
         *   },
         *   // Only set this to true for trusted server-side calls that have already verified the CSRF token
         *   skipCSRFCheck: true
         * })
         */
        signOut: async (options: SignOutAPIOptions): Promise<SignOutAPIReturn> => {
            return signOut({ ctx, ...options, skipCSRFCheck: true })
        },
    }
}
