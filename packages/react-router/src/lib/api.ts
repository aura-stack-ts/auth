import type {
    ReactRouterSignInAPIOptions,
    ReactRouterSignInCredentialsAPIOptions,
    ReactRouterSignInCredentialsReturn,
    ReactRouterSignInReturn,
    ReactRouterSignOutAPIOptions,
    ReactRouterSignOutReturn,
    ReactRouterUpdateSessionReturn,
    ReactRouterUpdateSessionAPIOptions,
} from "@/@types"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type { BuiltInOAuthProvider, GetSessionAPIOptions, LiteralUnion } from "@aura-stack/react/types"

export const getSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options: GetSessionAPIOptions): Promise<Session<DefaultUser> | null> => {
        try {
            const session = await api.getSession(options)
            if (!session.success) {
                return null
            }
            return session.session
        } catch {
            console.error("[error:server] getSession - Failed to retrieve session")
            return null
        }
    }
}

export const signIn = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterSignInAPIOptions>(
        providerId: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ): Promise<ReactRouterSignInReturn<Options>> => {
        const signIn = await api.signIn(providerId, options)
        if (options?.redirect === false) {
            return signIn as ReactRouterSignInReturn<Options>
        }
        return signIn.toResponse() as ReactRouterSignInReturn<Options>
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterSignInCredentialsAPIOptions>(
        options: Options
    ): Promise<ReactRouterSignInCredentialsReturn<Options>> => {
        const signIn = await api.signInCredentials({
            ...options,
            payload: options.payload,
        })
        if (options?.redirect === false) {
            return signIn as ReactRouterSignInCredentialsReturn<Options>
        }
        return signIn.toResponse() as ReactRouterSignInCredentialsReturn<Options>
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterUpdateSessionAPIOptions<DefaultUser>>(
        options: Options
    ): Promise<ReactRouterUpdateSessionReturn<Options, DefaultUser>> => {
        const updated = await api.updateSession({
            headers: options.request.headers,
            ...options,
        })
        if (options?.redirect === false) {
            return updated as ReactRouterUpdateSessionReturn<Options, DefaultUser>
        }
        return updated.toResponse() as ReactRouterUpdateSessionReturn<Options, DefaultUser>
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterSignOutAPIOptions>(options: Options): Promise<ReactRouterSignOutReturn<Options>> => {
        const out = await api.signOut({
            headers: options.request.headers,
            ...options,
        })
        if (options?.redirect === false) {
            return out as ReactRouterSignOutReturn<Options>
        }
        return out.toResponse() as ReactRouterSignOutReturn<Options>
    }
}

export const api = <DefaultUser extends User = User>(config: AuthInstance<DefaultUser>) => {
    return {
        /**
         * Retrieves the current session data from the server-side.
         *
         * @param options - Options for the API call, including headers to verify `session_token` cookie.
         * @returns An object containing session data see {@link User}
         * @example
         * export const loader = async ({ request }) => {
         *   const session = await api.getSession({
         *     headers: request.headers
         *   })
         * }
         */
        getSession: getSession<DefaultUser>(config),
        /**
         * Initiates the sign-in flow on the server-side. By default the redirect is automatic, but it can be
         * disabled by setting the `redirect` option to `false`. When redirect is disabled, the API returns the
         * `signInURL` in the response for the client to handle the redirect manually.
         *
         * @param oauth - The OAuth provider to use for sign-in (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the sign-in process, including headers and redirect behavior.
         * @returns The object returned by the API call {@link ReactRouterSignInReturn}
         * @example
         * export const action = async ({ request }) => {
         *   return await api.signIn("github", {
         *     redirectTo: "/dashboard",
         *     request,
         *   })
         * }
         */
        signIn: signIn<DefaultUser>(config),
        /**
         * Signs in a user using credentials (`username` and `password`) on the server-side. The credentials must
         * be verified by the `authorize` function provided in the `credentials` configuration option.
         *
         * @param options - Options for the API call, including the credentials payload, headers, and redirect behavior.
         * @returns The object returned by the API call {@link ReactRouterSignInCredentialsReturn}
         * @example
         * export const action = async ({ request }) => {
         *   const formData = await request.formData()
         *   const username = formData.get("username") as string
         *   const password = formData.get("password") as string
         *
         *   return await api.signInCredentials({
         *     payload: {
         *       username,
         *       password
         *     },
         *     request,
         *     redirectTo: "/dashboard",
         *   })
         * }
         */
        signInCredentials: signInCredentials<DefaultUser>(config),
        /**
         * Updates the current session on the server-side. It allows partial updates to the session object, such as
         * modifying user fields or extending the session expiry. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including the session updates, headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link ReactRouterUpdateSessionReturn}
         * @example
         * export const action = async ({ request }) => {
         *   const formData = await request.formData()
         *   const name = formData.get("name") as string
         *   const email = formData.get("email") as string
         *
         *   return await api.updateSession({
         *     session: {
         *       user: {
         *         name,
         *         email,
         *       }
         *     },
         *     request,
         *     redirectTo: "/dashboard",
         *   })
         * }
         */
        updateSession: updateSession<DefaultUser>(config),
        /**
         * Signs out the current session on the server-side. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link ReactRouterSignOutReturn}
         * @example
         * export const action = async ({ request }) => {
         *   return await api.signOut({
         *     request,
         *     redirectTo: "/goodbye",
         *   })
         * }
         */
        signOut: signOut<DefaultUser>(config),
    }
}
