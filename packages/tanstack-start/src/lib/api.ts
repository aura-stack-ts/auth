import { createServerFn, type OptionalFetcher } from "@tanstack/react-start"
import { getRequest, getRequestHeaders } from "@tanstack/react-start/server"
import type {
    TanstackStartSignInCredentialsOptions,
    TanstackStartSignInCredentialsReturn,
    TanstackStartSignInOptions,
    TanstackStartSignInReturn,
    TanstackStartSignOutOptions,
    TanstackStartSignOutReturn,
    TanstackStartUpdateSessionOptions,
    TanstackStartUpdateSessionReturn,
    TanstackStartSignUpOptions,
    TanstackStartSignUpReturn,
    TanstackStartGetProviderTokensOptions,
    TanstackStartGetProviderTokensReturn,
    TanstackStartGetAccessTokenOptions,
    TanstackStartGetAccessTokenReturn,
    TanstackStartRefreshUserInfoOptions,
    TanstackStartRefreshUserInfoReturn,
    TanstackStartRevokeTokenOptions,
    TanstackStartRevokeTokenReturn,
    TanstackStartDisconnectProviderOptions,
    TanstackStartDisconnectProviderReturn,
    TanstackStartIsProviderConnectedOptions,
    TanstackStartIsProviderConnectedReturn,
} from "@/@types/api.ts"
import type { AuthInstance, Session, User } from "@aura-stack/auth"
import type { InferSchema, RemoveIndexSignature, SchemaTypes, Wrap } from "@aura-stack/react/types"
import type { zod } from "@/identity/zod"

export const getSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({
        method: "GET",
        strict: true,
    }).handler<any>(async () => {
        const session = await api.getSession({
            headers: getRequestHeaders(),
        })
        if (!session.success) return null
        return session.session
    }) as OptionalFetcher<undefined, undefined, Promise<Session<DefaultUser> | null>>
}

export const signIn = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartSignInOptions) => data)
        .handler<Promise<TanstackStartSignInReturn>>(async ({ data }) => {
            const { providerId, ...options } = data
            const output = await api.signIn(providerId, {
                ...options,
                headers: getRequestHeaders(),
                request: getRequest(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartSignInCredentialsOptions) => data)
        .handler<Promise<TanstackStartSignInCredentialsReturn>>(async ({ data }) => {
            const output = await api.signInCredentials({
                ...data,
                headers: getRequestHeaders(),
                request: getRequest(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartSignOutOptions = {}) => data)
        .handler<Promise<TanstackStartSignOutReturn>>(async ({ data }) => {
            const output = await api.signOut({
                ...data,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartUpdateSessionOptions<DefaultUser>) => data)
        .handler<Promise<TanstackStartUpdateSessionReturn<DefaultUser>>>(async ({ data }) => {
            const output = await api.updateSession({
                ...data,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const signUp = <DefaultUser extends User = User, T extends Record<string, any> = Record<string, any>>({
    api,
}: AuthInstance<DefaultUser>) => {
    return (
        createServerFn({ method: "POST" })
            // @ts-ignore
            .validator((data: TanstackStartSignUpOptions<T>) => data)
            .handler<Promise<TanstackStartSignUpReturn>>(async ({ data }) => {
                const output = await api.signUp<T>({
                    ...data,
                    payload: data.payload as T,
                    headers: getRequestHeaders(),
                    request: getRequest(),
                })
                const { headers: _h, toResponse: _t, ...spread } = output
                return spread
            })
    )
}

export const getProviderTokens = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "GET" })
        .validator((data: TanstackStartGetProviderTokensOptions) => data)
        .handler<Promise<TanstackStartGetProviderTokensReturn>>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.getProviderTokens(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const getAccessToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "GET" })
        .validator((data: TanstackStartGetAccessTokenOptions) => data)
        .handler<Promise<TanstackStartGetAccessTokenReturn>>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.getAccessToken(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const refreshUserInfo = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartRefreshUserInfoOptions) => data)
        .handler<any>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.refreshUserInfo(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        }) as OptionalFetcher<undefined, any, Promise<TanstackStartRefreshUserInfoReturn<DefaultUser>>>
}

export const revokeToken = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartRevokeTokenOptions) => data)
        .handler<Promise<TanstackStartRevokeTokenReturn>>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.revokeToken(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const disconnectProvider = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "POST" })
        .validator((data: TanstackStartDisconnectProviderOptions) => data)
        .handler<Promise<TanstackStartDisconnectProviderReturn>>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.disconnectProvider(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const isProviderConnected = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createServerFn({ method: "GET" })
        .validator((data: TanstackStartIsProviderConnectedOptions) => data)
        .handler<Promise<TanstackStartIsProviderConnectedReturn>>(async ({ data }) => {
            const { oauth, ...options } = data
            const output = await api.isProviderConnected(oauth, {
                ...options,
                headers: getRequestHeaders(),
            })
            const { headers: _h, toResponse: _t, ...spread } = output
            return spread
        })
}

export const api = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>(
    config: AuthInstance<DefaultUser, SignUpSchema>
) => {
    return {
        getSession: getSession<DefaultUser>(config),
        signIn: signIn(config),
        signInCredentials: signInCredentials(config),
        signOut: signOut(config),
        updateSession: updateSession<DefaultUser>(config),
        signUp: signUp<DefaultUser, Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>(config),
        getProviderTokens: getProviderTokens(config),
        getAccessToken: getAccessToken(config),
        refreshUserInfo: refreshUserInfo<DefaultUser>(config),
        revokeToken: revokeToken(config),
        disconnectProvider: disconnectProvider(config),
        isProviderConnected: isProviderConnected(config),
    }
}
