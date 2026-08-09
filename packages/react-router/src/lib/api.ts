import type {
    ReactRouterAPI,
    ReactRouterSignInAPIOptions,
    ReactRouterSignInCredentialsAPIOptions,
    ReactRouterSignInCredentialsReturn,
    ReactRouterSignInReturn,
    ReactRouterSignOutAPIOptions,
    ReactRouterSignOutReturn,
    ReactRouterUpdateSessionReturn,
    ReactRouterUpdateSessionAPIOptions,
    ReactRouterSignUpAPIOptions,
    ReactRouterSignUpReturn,
    ReactRouterRefreshUserInfoAPIOptions,
    ReactRouterRevokeTokenAPIOptions,
    ReactRouterDisconnectProviderAPIOptions,
    ReactRouterProviderConnectedAPIOptions,
} from "@/@types/api"
import type { zod } from "@/identity/zod"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    AccessTokenAPIOptions,
    AccessTokenAPIReturn,
    BuiltInOAuthProvider,
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    GetSessionAPIOptions,
    LiteralUnion,
    RefreshUserInfoAPIReturn,
    RevokeTokenAPIReturn,
    DisconnectProviderAPIReturn,
    ProviderConnectedAPIReturn,
    SchemaTypes,
    Wrap,
    RemoveIndexSignature,
    InferSchema,
} from "@aura-stack/react/types"

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
        const signIn = await api.signInCredentials(options)
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

export const getProviderTokens = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: GetProviderTokensAPIOptions
    ): Promise<GetProviderTokensAPIReturn> => {
        return await api.getProviderTokens(oauth, options)
    }
}

export const getAccessToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: AccessTokenAPIOptions): Promise<AccessTokenAPIReturn> => {
        return await api.getAccessToken(oauth, options)
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

type Infer<T> = Wrap<RemoveIndexSignature<InferSchema<T>>> & Record<string, any>

export const signUp = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>({
    api,
}: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterSignUpAPIOptions<Infer<SignUpSchema>>>(
        options: Options
    ): Promise<ReactRouterSignUpReturn<Options>> => {
        const signUp = await api.signUp<Infer<SignUpSchema>>({
            headers: options.request.headers,
            ...options,
        })
        if (options?.redirect === false) {
            return signUp as ReactRouterSignUpReturn<Options>
        }
        return signUp.toResponse() as ReactRouterSignUpReturn<Options>
    }
}

export const refreshUserInfo = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterRefreshUserInfoAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ): Promise<RefreshUserInfoAPIReturn<DefaultUser>> => {
        const refresh = await api.refreshUserInfo(oauth, {
            headers: options.request.headers,
            ...options,
        })
        return refresh
    }
}

export const revokeToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterRevokeTokenAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ): Promise<RevokeTokenAPIReturn> => {
        const revoke = await api.revokeToken(oauth, {
            headers: options.request.headers,
            ...options,
        })
        return revoke
    }
}

export const disconnectProvider = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterDisconnectProviderAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ): Promise<DisconnectProviderAPIReturn> => {
        const disconnect = await api.disconnectProvider(oauth, {
            headers: options.request.headers,
            ...options,
        })
        return disconnect
    }
}

export const isProviderConnected = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Options extends ReactRouterProviderConnectedAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ): Promise<ProviderConnectedAPIReturn> => {
        const connected = await api.isProviderConnected(oauth, {
            headers: options.request.headers,
            ...options,
        })
        return connected
    }
}

export const api = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>(
    config: AuthInstance<DefaultUser, SignUpSchema>
) => {
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
         * Retrieves the OAuth provider tokens for the current session on the server-side. It allows access to the
         * provider's access and refresh tokens, which can be used for making authenticated requests to the provider's API.
         *
         * @params options - Options for the API call, including headers to verify `session_token` cookie.
         * @returns The object returned by the API call {@link GetProviderTokensAPIReturn}
         * @example
         * export const loader = async ({ request }) => {
         *   return await api.getProviderTokens("github", {
         *     request,
         *     headers: request.headers
         *   })
         * }
         *
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
         * export const loader = async ({ request }) => {
         *   const { accessToken } = await api.getAccessToken("github", {
         *     request,
         *     headers: request.headers
         *   })
         *
         *   // Use the access token to make authenticated requests to the provider's API
         * }
         */
        getAccessToken: getAccessToken<DefaultUser>(config),
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
        /**
         * Signs up a new user on the server-side. It requires a `payload` with the necessary information for
         * user creation and a callback function configured in `signUp.onCreateUser` to handle the actual user
         * creation logic.
         *
         * @param options - Options for the API call, including the sign-up payload, headers, and redirect behavior.
         * @returns The object returned by the API call {@link ReactRouterSignUpReturn}
         * @example
         * export const action = async ({ request }) => {
         *   const formData = await request.formData()
         *   const name = formData.get("name") as string
         *   const email = formData.get("email") as string
         *   const password = formData.get("password") as string
         *
         *   return await api.signUp({
         *     payload: {
         *       name,
         *       email,
         *       password
         *     },
         *     request,
         *     redirectTo: "/dashboard",
         *   })
         * }
         */
        signUp: signUp<DefaultUser, SignUpSchema>(config),
        /**
         * Refreshes user information from the OAuth provider on the server-side. It retrieves the latest
         * user information from the provider and updates the session accordingly.
         *
         * @param oauth - The OAuth provider to refresh user information from (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the refresh operation, including headers and request object.
         * @returns The object returned by the API call {@link ReactRouterRefreshUserInfoReturn}
         * @example
         * export const action = async ({ request }) => {
         *   return await api.refreshUserInfo("github", {
         *     request,
         *   })
         * }
         */
        refreshUserInfo: refreshUserInfo<DefaultUser>(config),
        /**
         * Revokes the OAuth provider token on the server-side. It invalidates the access token for the specified
         * provider, effectively disconnecting the user from that provider.
         *
         * @param oauth - The OAuth provider to revoke the token for (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the revoke operation, including headers and request object.
         * @returns The object returned by the API call {@link ReactRouterRevokeTokenReturn}
         * @example
         * export const action = async ({ request }) => {
         *   return await api.revokeToken("github", {
         *     request,
         *   })
         * }
         */
        revokeToken: revokeToken<DefaultUser>(config),
        /**
         * Disconnects the OAuth provider on the server-side. It revokes the access token and removes the provider
         * connection from the user's session.
         *
         * @param oauth - The OAuth provider to disconnect (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the disconnect operation, including headers and request object.
         * @returns The object returned by the API call {@link ReactRouterDisconnectProviderReturn}
         * @example
         * export const action = async ({ request }) => {
         *   return await api.disconnectProvider("github", {
         *     request,
         *   })
         * }
         */
        disconnectProvider: disconnectProvider<DefaultUser>(config),
        /**
         * Checks if the OAuth provider is connected on the server-side. It returns a boolean indicating whether
         * the user has an active connection with the specified provider.
         *
         * @param oauth - The OAuth provider to check connection status for (e.g., "github", "gitlab", "bitbucket").
         * @param options - Optional parameters for the check operation, including headers and request object.
         * @returns The object returned by the API call {@link ReactRouterProviderConnectedReturn}
         * @example
         * export const loader = async ({ request }) => {
         *   const { connected } = await api.isProviderConnected("github", {
         *     request,
         *   })
         *   return Response.json({ connected })
         * }
         */
        isProviderConnected: isProviderConnected<DefaultUser>(config),
    } satisfies ReactRouterAPI<DefaultUser, SignUpSchema>
}
