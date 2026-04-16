import { redirect } from "react-router"
import type {
    ReactRouterSignInAPIOptions,
    ReactRouterSignInAPIReturn,
    ReactRouterSignInCredentialsAPIOptions,
    ReactRouterSignInCredentialsAPIReturn,
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
    return async <Redirect extends boolean = true>(
        providerId: LiteralUnion<BuiltInOAuthProvider>,
        options?: ReactRouterSignInAPIOptions
    ): Promise<ReactRouterSignInAPIReturn<Redirect>> => {
        const signIn = await api.signIn(providerId, options)
        if (options?.redirect ?? true) {
            return signIn.toResponse() as ReactRouterSignInAPIReturn<Redirect>
        }
        return signIn as unknown as ReactRouterSignInAPIReturn<Redirect>
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Redirect extends boolean = true>(
        payload: CredentialsPayload,
        options?: ReactRouterSignInCredentialsAPIOptions
    ): Promise<ReactRouterSignInCredentialsAPIReturn<Redirect>> => {
        const signIn = await api.signInCredentials({
            payload,
            ...options,
        })
        if (options?.redirect ?? true) {
            return signIn.toResponse() as ReactRouterSignInCredentialsAPIReturn<Redirect>
        }
        return signIn as unknown as ReactRouterSignInCredentialsAPIReturn<Redirect>
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
