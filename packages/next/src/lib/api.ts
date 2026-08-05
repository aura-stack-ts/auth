import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { parseSetCookie } from "@aura-stack/react/cookies"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    NextSignInCredentials,
    NextSignInReturn,
    NextSignOutReturn,
    NextUpdateSessionOptions,
    NextUpdateSessionReturn,
    NextAPI,
    NextSignUpReturn,
} from "@/@types/api"
import type {
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInCredentialsAPIOptions,
    GetProviderTokensAPIOptions,
    AccessTokenAPIOptions,
    SignUpAPIOptions,
    RefreshUserInfoAPIOptions,
    RevokeTokenAPIOptions,
    DisconnectProviderAPIOptions,
    ProviderConnectedAPIOptions,
} from "@aura-stack/react/types"

/**
 * Internal helper to sync Set-Cookie headers from Aura Auth to Next.js cookie store.
 */
const setCookies = async (responseHeaders: Headers) => {
    const cookieStore = await cookies()
    const setCookies = responseHeaders.getSetCookie()
    for (const cookieStr of setCookies) {
        const { name, value, ...options } = parseSetCookie(cookieStr)
        cookieStore.set(name, value ?? "", options)
    }
}

export const getSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options?: GetSessionAPIOptions): Promise<Session<DefaultUser> | null> => {
        try {
            const session = await api.getSession({
                ...options,
                headers: await headers(),
            })
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
    return async <Options extends SignInAPIOptions>(
        provider: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ): Promise<NextSignInReturn<Options>> => {
        const signIn = await api.signIn(provider, {
            headers: await headers(),
            ...options,
            redirect: !!options?.redirect,
        })
        if (options?.redirect === false) {
            return signIn as NextSignInReturn<Options>
        }
        if (signIn.success && signIn.signInURL) {
            return redirect(signIn.signInURL)
        }
        return signIn as NextSignInReturn<Options>
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends SignInCredentialsAPIOptions>(options: Options): Promise<NextSignInCredentials<Options>> => {
        const signIn = await api.signInCredentials({
            headers: await headers(),
            ...options,
            redirect: !!options.redirect,
        })
        await setCookies(signIn.headers)
        if (signIn.success && signIn.redirectURL) {
            return redirect(signIn.redirectURL)
        }
        return signIn as NextSignInCredentials<Options>
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends NextUpdateSessionOptions<DefaultUser>>(
        options: Options
    ): Promise<NextUpdateSessionReturn<Options, DefaultUser>> => {
        const updated = await api.updateSession({
            headers: await headers(),
            ...options,
            redirect: !!options.redirect,
            session: options.session,
        })
        await setCookies(updated.headers)
        if (updated.success && updated.redirectURL) {
            return redirect(updated.redirectURL)
        }
        return updated as NextUpdateSessionReturn<Options, DefaultUser>
    }
}

export const getProviderTokens = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: GetProviderTokensAPIOptions) => {
        return await api.getProviderTokens(oauth, { headers: await headers(), ...options })
    }
}

export const getAccessToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: AccessTokenAPIOptions) => {
        return await api.getAccessToken(oauth, { headers: await headers(), ...options })
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends SignOutAPIOptions>(options?: Partial<Options>): Promise<NextSignOutReturn<Options>> => {
        const out = await api.signOut({
            headers: await headers(),
            ...options,
            redirect: !!options?.redirect,
        })
        await setCookies(out.headers)
        if (out.success && out.redirectURL) {
            return redirect(out.redirectURL)
        }
        return out as NextSignOutReturn<Options>
    }
}

export const signUp = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends SignUpAPIOptions>(options: Options): Promise<NextSignUpReturn<Options>> => {
        const signUp = await api.signUp({
            headers: await headers(),
            ...options,
            redirect: !!options.redirect,
        })
        await setCookies(signUp.headers)
        if (signUp.success && signUp.redirectURL) {
            return redirect(signUp.redirectURL)
        }
        return signUp as NextSignUpReturn<Options>
    }
}

export const refreshUserInfo = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends RefreshUserInfoAPIOptions>(oauth: LiteralUnion<BuiltInOAuthProvider>, options?: Options) => {
        const refresh = await api.refreshUserInfo(oauth, {
            headers: await headers(),
            ...options,
        })
        await setCookies(refresh.headers)
        return refresh
    }
}

export const revokeToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends RevokeTokenAPIOptions>(oauth: LiteralUnion<BuiltInOAuthProvider>, options?: Options) => {
        const revoke = await api.revokeToken(oauth, {
            headers: await headers(),
            ...options,
        })
        await setCookies(revoke.headers)
        return revoke
    }
}

export const disconnectProvider = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends DisconnectProviderAPIOptions>(oauth: LiteralUnion<BuiltInOAuthProvider>, options?: Options) => {
        const disconnect = await api.disconnectProvider(oauth, {
            headers: await headers(),
            ...options,
        })
        await setCookies(disconnect.headers)
        return disconnect
    }
}

export const isProviderConnected = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ProviderConnectedAPIOptions>(oauth: LiteralUnion<BuiltInOAuthProvider>, options?: Options) => {
        return await api.isProviderConnected(oauth, {
            headers: await headers(),
            ...options,
        })
    }
}

export const api = <DefaultUser extends User = User>(config: AuthInstance<DefaultUser>) => {
    return {
        /**
         * Retrieves the current session data from the server-side.
         *
         * @param options - Options for the API call, including headers to verify `session_token` cookie.
         * @returns An object containing session data see {@link User}
         */
        getSession: getSession<DefaultUser>(config),
        /**
         * Initiates the sign-in flow on the server-side. By default the redirect is automatic, but it can be
         * disabled by setting the `redirect` option to `false`. When redirect is disabled, the API returns the
         * `signInURL` in the response for the client to handle the redirect manually.
         *
         * @param oauth - The OAuth provider to use for sign-in (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the sign-in process, including headers and redirect behavior.
         * @returns The object returned by the API call {@link SignInAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.signIn("github", {
         *   redirectTo: "/dashboard",
         *   headers: await headers()
         * })
         */
        signIn: signIn<DefaultUser>(config),
        /**
         * Signs in a user using credentials (`username` and `password`) on the server-side. The credentials must
         * be verified by the `authorize` function provided in the `credentials` configuration option.
         *
         * @param options - Options for the API call, including the credentials payload, headers, and redirect behavior.
         * @returns The object returned by the API call {@link SignInCredentialsAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.signInCredentials({
         *   payload: {
         *     username: "johndoe",
         *     password: "1234567890"
         *   },
         *   redirectTo: "/dashboard",
         *   headers: await headers()
         * })
         */
        signInCredentials: signInCredentials<DefaultUser>(config),
        /**
         * Updates the current session on the server-side. It allows partial updates to the session object, such as
         * modifying user fields or extending the session expiry. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including the session updates, headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link UpdateSessionAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.updateSession({
         *   session: {
         *     user: {
         *       name: "John Doe",
         *       email: "john.doe@example.com"
         *     }
         *   },
         *   redirectTo: "/dashboard",
         *   headers: await headers()
         * })
         */
        updateSession: updateSession<DefaultUser>(config),
        /**
         * Retrieves the OAuth provider tokens for the current session on the server-side. It allows access to the
         * provider's access and refresh tokens, which can be used for making authenticated requests to the provider's API.
         *
         * @params options - Options for the API call, including headers to verify `session_token` cookie.
         * @returns The object returned by the API call {@link GetProviderTokensAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.getProviderTokens("github", {
         *   headers: await headers()
         * })
         */
        getProviderTokens: getProviderTokens<DefaultUser>(config),
        /**
         * Retrieves the access token for a specific OAuth provider on the server-side.
         * It implements CSRF Protection by default, for server-side calls it only verifies and validates the CSRF Token,
         * it also provides Double-Submit Cookie protection by requiring the `session_token` cookie to be included in
         * the request headers.
         *
         * > **NOTE**: This method is based on `getProviderTokens` and it's recommended for simple use cases where only the
         * access token is needed. For more advanced scenarios, consider using `getProviderTokens` directly.
         *
         * @params oauth - The OAuth provider for which to retrieve the access token (e.g., "github", "gitlab", "bitbucket").
         * @params options - Options for the API call, including headers and request object.
         * @example
         * const { success, accessToken } = await api.getAccessToken("github", {
         *    headers: getHeaders()
         * })
         */
        getAccessToken: getAccessToken<DefaultUser>(config),
        /**
         * Signs out the current session on the server-side. It implements CSRF Protection by default, for
         * server-side calls it only verifies and validates the CSRF Token, it also provides Double-Submit
         * Cookie protection by requiring the `session_token` cookie to be included in the request headers.
         *
         * @param options - Options for the API call, including headers, redirect behavior, and CSRF check bypass.
         * @returns The object returned by the API call {@link SignOutAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.signOut({
         *   redirectTo: "/goodbye",
         *   headers: await headers(),
         * })
         */
        signOut: signOut<DefaultUser>(config),
        /**
         * Signs up a new user on the server-side. It requires a `payload` with the necessary information for
         * user creation and a callback function configured in `signUp.onCreateUser` to handle the actual user
         * creation logic.
         *
         * @param options - Options for the API call, including the sign-up payload, headers, and redirect behavior.
         * @returns The object returned by the API call {@link SignUpAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.signUp({
         *   payload: {
         *     name: "John",
         *     email: "john.doe@example.com",
         *     password: "1234567890"
         *   },
         *   redirectTo: "/dashboard",
         *   headers: await headers()
         * })
         */
        signUp: signUp<DefaultUser>(config),
        /**
         * Refreshes user information from the OAuth provider on the server-side. It retrieves the latest
         * user information from the provider and updates the session accordingly.
         *
         * @param oauth - The OAuth provider to refresh user information from (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the refresh operation, including headers.
         * @returns The object returned by the API call {@link RefreshUserInfoAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.refreshUserInfo("github", {
         *   headers: await headers()
         * })
         */
        refreshUserInfo: refreshUserInfo<DefaultUser>(config),
        /**
         * Revokes the OAuth provider token on the server-side. It invalidates the access token for the specified
         * provider.
         *
         * @param oauth - The OAuth provider to revoke the token for (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the revoke operation, including headers.
         * @returns The object returned by the API call {@link RevokeTokenAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.revokeToken("github", {
         *   headers: await headers()
         * })
         */
        revokeToken: revokeToken<DefaultUser>(config),
        /**
         * Disconnects the OAuth provider on the server-side. It revokes the access token and removes the provider
         * connection from the user's session.
         *
         * @param oauth - The OAuth provider to disconnect (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the disconnect operation, including headers.
         * @returns The object returned by the API call {@link DisconnectProviderAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const response = await api.disconnectProvider("github", {
         *   headers: await headers()
         * })
         */
        disconnectProvider: disconnectProvider<DefaultUser>(config),
        /**
         * Checks if the OAuth provider is connected on the server-side. It returns a boolean indicating whether
         * the user has an active connection with the specified provider.
         *
         * @param oauth - The OAuth provider to check connection status for (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the check operation, including headers.
         * @returns The object returned by the API call {@link ProviderConnectedAPIReturn}
         * @example
         * import { headers } from "next/headers"
         *
         * const { connected } = await api.isProviderConnected("github", {
         *   headers: await headers()
         * })
         */
        isProviderConnected: isProviderConnected<DefaultUser>(config),
    } satisfies NextAPI<DefaultUser>
}
