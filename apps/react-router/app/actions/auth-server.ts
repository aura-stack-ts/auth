import { api } from "~/auth"
import { redirect } from "react-router"
import type { GetSessionAPIOptions, Session, SignInAPIOptions, SignOutAPIOptions } from "@aura-stack/auth"

export const getSession = async (request: Request, options?: GetSessionAPIOptions): Promise<Session | null> => {
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

export const signIn = async (providerId: string, options?: SignInAPIOptions) => {
    return await api.signIn(providerId, options)
}

export const signOut = async (request: Request, options?: SignOutAPIOptions) => {
    try {
        const response = await api.signOut({
            headers: request.headers,
            ...options,
        })
        if (response.status === 202) {
            return redirect(options?.redirectTo ?? "/", {
                headers: response.headers,
            })
        }
        const json = await response.json()
        return json
    } catch (error) {
        console.log("[error:server] signOut", error)
        return null
    }
}
