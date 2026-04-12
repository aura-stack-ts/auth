import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import {
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    CredentialsPayload,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@aura-stack/react/types"
export type {
    Session,
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    CredentialsPayload,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@aura-stack/react/types"

export const getSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options?: GetSessionAPIOptions): Promise<Session<DefaultUser> | null> => {
        try {
            const session = await api.getSession({
                headers: await headers(),
                ...options,
            })
            if (!session.authenticated) {
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
    return async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions) => {
        const signIn = await api.signIn(provider, {
            headers: await headers(),
            ...options,
            redirect: false,
        })
        return redirect(signIn.signInURL)
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (payload: CredentialsPayload, options: SignInAPIOptions) => {
        const signIn = await api.signInCredentials({
            payload,
            headers: await headers(),
            ...options,
            redirect: false,
        })
        if (options.redirect && signIn.success && signIn.redirectURL) {
            return redirect(signIn.redirectURL)
        }
        return signIn
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (session: DeepPartial<Session<DefaultUser>>, options?: GetSessionAPIOptions) => {
        const updated = await api.updateSession({
            session,
            headers: await headers(),
            ...options,
        })
        return updated
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options?: SignOutAPIOptions) => {
        const cookieStore = await cookies()
        const response = await api.signOut({
            headers: await headers(),
            ...options,
        })
        if (response.status === 202) {
            const setCookies = response.headers.getSetCookie()
            for (const cookie of setCookies) {
                const nameMatch = cookie.match(/^([^=]+)=/)
                if (nameMatch) {
                    cookieStore.delete(nameMatch[1])
                }
            }
            redirect(options?.redirectTo ?? "/")
        }
        return response.json()
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
