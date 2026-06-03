import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    NextSignInCredentials,
    NextSignInReturn,
    NextSignOutReturn,
    NextUpdateSessionOptions,
    NextUpdateSessionReturn,
} from "@/@types/api"
import type {
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInCredentialsAPIOptions,
} from "@aura-stack/react/types"

/**
 * Internal helper to sync Set-Cookie headers from Aura Auth to Next.js cookie store.
 */
async function applyCookies(responseHeaders: Headers) {
    const cookieStore = await cookies()
    const setCookies = responseHeaders.getSetCookie()
    for (const cookieStr of setCookies) {
        const [nameValue] = cookieStr.split(";").map((s) => s.trim())
        const [name, value] = nameValue.split("=")
        cookieStore.set(name, value, {})
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
            redirect: false,
        })
        if (options?.redirect === false) {
            return signIn as NextSignInReturn<Options>
        }
        if (signIn.success && options?.redirectTo) {
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
            payload: options.payload,
        })
        await applyCookies(signIn.headers)
        if (signIn.success && options?.redirectTo && signIn.redirectURL) {
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
            ...options,
            session: options.session,
            headers: await headers(),
        })
        await applyCookies(updated.headers)
        if (updated.success && options?.redirectTo && updated.redirectURL) {
            return redirect(updated.redirectURL)
        }
        return updated as NextUpdateSessionReturn<Options, DefaultUser>
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends SignOutAPIOptions>(options?: Partial<Options>): Promise<NextSignOutReturn<Options>> => {
        const out = await api.signOut({
            headers: await headers(),
            ...options,
        })
        await applyCookies(out.headers)
        if (out.success && out.redirectURL) {
            return redirect(out.redirectURL)
        }
        return out as NextSignOutReturn<Options>
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
    }
}
