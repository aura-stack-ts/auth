import { api } from "~/lib/auth"
import { redirect } from "react-router"
import type { Session } from "@aura-stack/react"
import type { GetSessionAPIOptions, SignInAPIOptions, SignOutAPIOptions } from "@aura-stack/react/types"

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

export const signIn = async (providerId: string, options?: SignInAPIOptions) => {
    return await api.signIn(providerId, options)
}

export const signOut = async (request: Request, options?: Omit<SignOutAPIOptions, "headers">) => {
    try {
        const response = await api.signOut({
            headers: request.headers,
            ...options,
        })
        if (response.ok) {
            return redirect(options?.redirectTo ?? "/", {
                headers: response.headers,
            })
        }
        const json = await response.json()
        return json
    } catch (error) {
        if (error instanceof Response) throw error
        console.error("[error:server] signOut", error)
        return null
    }
}
