import { redirect } from "react-router"
import type {
    ReactRouterSignInAPIOptions,
    ReactRouterSignInCredentialsAPIOptions,
    ReactRouterSignInCredentialsReturn,
    ReactRouterSignInReturn,
    ReactRouterSignOutAPIOptions,
} from "@/@types"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    BuiltInOAuthProvider,
    CredentialsPayload,
    GetSessionAPIOptions,
    GetSessionOptions,
    LiteralUnion,
    UpdateSessionAPIReturn,
    UpdateSessionOptions,
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
        payload: CredentialsPayload,
        options?: Options
    ): Promise<ReactRouterSignInCredentialsReturn<Options>> => {
        const result = await api.signInCredentials({
            payload,
            ...options,
        })
        if (options?.redirect === false) {
            return result as ReactRouterSignInCredentialsReturn<Options>
        }
        return result.toResponse() as ReactRouterSignInCredentialsReturn<Options>
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (
        session: UpdateSessionOptions<DefaultUser>,
        options: GetSessionOptions
    ): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
        return await api.updateSession({
            session,
            headers: options.headers,
        })
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options: ReactRouterSignOutAPIOptions) => {
        const out = await api.signOut(options)
        if (out.success && options.redirectTo && out.redirectURL) {
            return redirect(out.redirectURL!, {
                headers: out.headers,
            })
        }
        return out.toResponse()
    }
}

export const api = <DefaultUser extends User = User>(config: AuthInstance<DefaultUser>) => {
    return {
        getSession: getSession<DefaultUser>(config),
        signIn: signIn<DefaultUser>(config),
        signInCredentials: signInCredentials<DefaultUser>(config),
        updateSession: updateSession<DefaultUser>(config),
        signOut: signOut<DefaultUser>(config),
    }
}
