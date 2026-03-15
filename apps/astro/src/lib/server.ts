import { api } from "@/auth"
import type { AuthServerContext } from "@/@types/types"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInAPIOptions,
    SignOutAPIOptions,
    GetSessionAPIOptions,
} from "@aura-stack/auth"

export const createAuthServer = async (context: AuthServerContext) => {
    const { request } = context

    const getSession = async (options?: GetSessionAPIOptions): Promise<Session | null> => {
        try {
            const session = await api.getSession({
                headers: request.headers,
                ...options,
            })
            if (!session.authenticated) return null
            return session.session
        } catch (error) {
            console.log("[error:server] getSession", error)
            return null
        }
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions) => {
        return await api.signIn(provider, options)
    }

    const signOut = async (options?: SignOutAPIOptions) => {
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
            console.log("[error:server] signOut", error)
            return null
        }
    }

    return {
        getSession,
        signIn,
        signOut,
    }
}
