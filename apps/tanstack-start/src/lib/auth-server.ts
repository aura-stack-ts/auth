import { api } from "@/auth"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest, getRequestHeaders } from "@tanstack/react-start/server"

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    try {
        const session = await api.getSession({
            headers: getRequestHeaders(),
        })
        if (!session.authenticated) return null
        return session.session as any
    } catch (error) {
        console.error("[error:server] getSession", error)
        return null
    }
})

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
    try {
        const response = await api.signOut({
            headers: getRequestHeaders(),
        })
        return redirect({ to: "/", headers: response.headers, reloadDocument: true })
    } catch (error) {
        console.error("[error:server] signOut", error)
        return null
    }
})

export const signInFn = createServerFn({ method: "POST" })
    .inputValidator((data: { provider: string }) => data)
    .handler(async ({ data }) => {
        try {
            const response = await api.signIn(data.provider, {
                request: getRequest(),
                redirect: false,
            })
            return redirect({
                href: response.signInURL,
            })
        } catch (error) {
            console.error("[error:server] signIn", error)
            return null
        }
    })
