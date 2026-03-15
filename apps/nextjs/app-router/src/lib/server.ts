"use server"

import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { api } from "@/auth"
import { refresh, revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
} from "@aura-stack/auth"

export const getSession = async (options?: GetSessionAPIOptions): Promise<Session | null> => {
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
        console.log("[error:server] getSession - Failed to retrieve session")
        return null
    }
}

export const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInAPIOptions) => {
    "use server"
    const signIn = await api.signIn(provider, {
        headers: await headers(),
        ...options,
        redirect: false,
    })
    return redirect(signIn.signInURL)
}

export const signOut = async (options?: SignOutAPIOptions) => {
    "use server"
    try {
        const cookieStore = await cookies()
        const response = await api.signOut({
            headers: await headers(),
            ...options,
        })
        if (response.status === 202) {
            const setCookies = response.headers.getSetCookie()
            for (const cookie of setCookies) {
                const nameMatch = cookie.match(/^([^=]+)=/)
                nameMatch && cookieStore.delete(nameMatch[1])
            }
            refresh()
            revalidatePath("/", "layout")
            redirect(options?.redirectTo ?? "/")
        }
        return response.json()
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.log("[error:server] signOut", error)
    }
}
