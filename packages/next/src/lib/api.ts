import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { AuthInstance, Session, User } from "@aura-stack/react"
import type {
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    CredentialsPayload,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignOutReturn,
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
                headers: await headers(),
                ...options,
            })
            console.log("getSession - Retrieved session:", session)
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
        const result = await api.signInCredentials({
            payload,
            headers: await headers(),
            ...options,
        })
        await applyCookies(result.headers)
        if (options.redirect && result.success && result.redirectURL) {
            return redirect(result.redirectURL)
        }
        return result
    }
}

export const updateSession = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (session: DeepPartial<Session<DefaultUser>>, options?: GetSessionAPIOptions) => {
        const result = await api.updateSession({
            session,
            headers: await headers(),
            skipCSRFCheck: true,
            ...options,
        })
        await applyCookies(result.headers)
        return result
    }
}

export const signOut = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async (options?: SignOutAPIOptions) => {
        const {
            headers: headersInit,
            success,
            redirectURL,
        } = await api.signOut({
            headers: await headers(),
            ...options,
        })
        await applyCookies(headersInit)
        if (success && redirectURL) {
            redirect(redirectURL)
        }
        return { success, redirectURL }
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
