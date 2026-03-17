import { api } from "@/auth"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInAPIOptions,
    SignOutAPIOptions,
    GetSessionAPIOptions,
} from "@aura-stack/auth"

export const getSession = async (request: Request, options?: GetSessionAPIOptions): Promise<Session | null> => {
    try {
        const session = await api.getSession({
            headers: request.headers,
            ...options,
        })
        if (!session.authenticated) return null
        return session.session
    } catch (error) {
        console.error("[error:server] getSession", error)
        return null
    }
}

/**
 * @deprecated
 */
export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions) => {
    const response = await api.signIn(provider, { ...options, redirect: false })
    console.log("[debug:server] signIn", { provider, response })
    return response
}

export const signOut = async (request: Request, options?: SignOutAPIOptions) => {
    try {
        const response = await api.signOut({
            headers: request.headers,
            ...options,
        })
        if (response.status === 202) {
            return response
        }
        const json = await response.json()
        return json
    } catch (error) {
        console.error("[error:server] signOut", error)
        return null
    }
}
