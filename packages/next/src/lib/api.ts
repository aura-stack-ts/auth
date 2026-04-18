import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type { NextSignInCredentials, NextSignInReturn, NextSignOutReturn } from "@/@types/api"
import type {
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInCredentialsAPIOptions,
    UpdateSessionAPIReturn,
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
        return redirect(signIn.signInURL) as NextSignInReturn<Options>
    }
}

export const signInCredentials = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async <O extends SignInCredentialsAPIOptions>(
        options: SignInCredentialsAPIOptions
    ): Promise<NextSignInCredentials<O>> => {
        const signIn = await api.signInCredentials({
            headers: await headers(),
            ...options,
            payload: options.payload,
        })
        await applyCookies(signIn.headers)
        if (signIn.success && options?.redirectTo) {
            redirect(signIn.redirectURL)
        }
        return signIn as NextSignInCredentials<O>
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (
        session: DeepPartial<Session<DefaultUser>>,
        options?: GetSessionAPIOptions
    ): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
        const updated = await api.updateSession({
            session,
            headers: await headers(),
            skipCSRFCheck: true,
            ...options,
        })
        await applyCookies(updated.headers)
        return updated
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
            redirect(out.redirectURL)
        }
        return out as NextSignOutReturn<Options>
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
