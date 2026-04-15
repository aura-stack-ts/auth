import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    BuiltInOAuthProvider,
    CredentialsPayload,
    GetSessionAPIOptions,
    GetSessionOptions,
    LiteralUnion,
    Prettify,
    SignInAPIOptions,
    SignInAPIReturn,
    SignInCredentialsAPIReturn,
    SignInOptions,
    SignOutOptions,
    UpdateSessionOptions,
} from "@aura-stack/react/types"
import { data, redirect } from "react-router"

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
        options?: Prettify<SignInAPIOptions<Redirect> & { request: Request }>
    ): Promise<SignInAPIReturn<Redirect>> => {
        return await api.signIn(providerId, options)
    }
}

export type SignInCredentialsReturn<Redirect extends boolean = true> = Redirect extends true
    ? Response
    : SignInCredentialsAPIReturn

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <Redirect extends boolean = true>(
        payload: CredentialsPayload,
        options?: Prettify<SignInOptions & { request: Request }>
    ): Promise<SignInCredentialsReturn<Redirect>> => {
        const signIn = await api.signInCredentials({
            payload,
            ...options,
        })
        if (signIn.success) {
            return redirect(signIn.redirectURL, {
                headers: signIn.headers,
            }) as SignInCredentialsReturn<Redirect>
        }
        return signIn as SignInCredentialsReturn<Redirect>
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (session: UpdateSessionOptions<DefaultUser>, options: GetSessionOptions) => {
        const updated = await api.updateSession({
            session,
            headers: options.headers,
        })

        return data(updated, {
            headers: updated.headers,
        })
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options: Prettify<SignOutOptions & { headers: HeadersInit }>) => {
        const out = await api.signOut({
            headers: options.headers,
            redirectTo: options?.redirectTo,
        })
        return data(out, {
            headers: out.headers,
        })
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
