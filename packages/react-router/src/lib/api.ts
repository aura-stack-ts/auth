import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    BuiltInOAuthProvider,
    CredentialsPayload,
    GetSessionOptions,
    LiteralUnion,
    Prettify,
    SignInOptions,
    SignOutOptions,
    UpdateSessionOptions,
} from "@aura-stack/react/types"
import { data, redirect } from "react-router"

export const getSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options: GetSessionOptions): Promise<Session<DefaultUser> | null> => {
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
    return async (providerId: LiteralUnion<BuiltInOAuthProvider>, options?: Prettify<SignInOptions & { request: Request }>) => {
        return await api.signIn(providerId, options)
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (payload: CredentialsPayload, options?: Prettify<SignInOptions & { request: Request }>) => {
        const signIn = await api.signInCredentials({
            payload,
            ...options,
            redirect: false,
        })
        if (signIn.success) {
            return redirect(signIn.redirectURL, {
                headers: signIn.headers,
            })
        }
        return signIn
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (session: UpdateSessionOptions<DefaultUser>, options: GetSessionOptions) => {
        const updated = await api.updateSession({
            session,
            headers: options.headers,
        })
        if (updated.updated) {
            return data(updated, {
                headers: updated.headers,
            })
        }
        return updated
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options: Prettify<SignOutOptions & { headers: HeadersInit }>) => {
        const response = await api.signOut({
            headers: options.headers,
            redirectTo: options?.redirectTo,
        })
        const json = await response.json()
        if (response.ok) {
            return data(json, {
                headers: response.headers,
                status: response.status,
            })
        }
        return json
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
