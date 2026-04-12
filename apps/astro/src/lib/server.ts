import { api } from "@/lib/auth"
import type { Session } from "@aura-stack/react"
import type { SignOutAPIOptions, GetSessionAPIOptions } from "@aura-stack/react/types"

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
