import { api } from "@/lib/auth"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest, getRequestHeaders } from "@tanstack/react-start/server"

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    try {
        const session = await api.getSession({
            headers: getRequestHeaders(),
        })
        if (!session.success) return null
        return session.session as any
    } catch (error) {
        console.error("[error:server] getSession", error)
        return null
    }
})

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
    const response = await api
        .signOut({
            headers: getRequestHeaders(),
        })
        .catch((error) => {
            console.error("[error:server] signOut", error)
            return null
        })
    throw redirect({ to: "/", headers: response?.headers, reloadDocument: true })
})

export const signInFn = createServerFn({ method: "POST" })
    .inputValidator((data: { provider: string }) => {
        if (!data || typeof data.provider !== "string" || !data.provider.trim()) {
            throw new Error("provider must be a non-empty string")
        }
        return data
    })
    .handler(async ({ data }) => {
        const response = await api
            .signIn(data.provider, {
                request: getRequest(),
                redirect: false,
            })
            .catch((error) => {
                console.error("[error:server] signIn", error)
                return null
            })
        throw redirect({
            href: response?.signInURL,
        })
    })

export const signInCredentialsFn = createServerFn({ method: "POST" })
    .inputValidator((data: { username: string; password: string }) => {
        if (!data || typeof data.username !== "string" || typeof data.password !== "string") {
            throw new Error("credentials payload is invalid")
        }
        return data
    })
    .handler(async ({ data }) => {
        const response = await api
            .signInCredentials({
                payload: {
                    username: data.username,
                    password: data.password,
                },
                request: getRequest(),
                headers: getRequestHeaders(),
                redirectTo: "/server",
            })
            .catch((error) => {
                console.error("[error:server] signInCredentials", error)
                return null
            })

        if (response?.redirectURL) {
            throw redirect({
                href: response.redirectURL,
                headers: response.headers,
            })
        }

        return null
    })

export const updateSessionFn = createServerFn({ method: "POST" })
    .inputValidator((data: { username?: string; email?: string }) => data)
    .handler(async ({ data }) => {
        const response = await api
            .updateSession({
                session: {
                    user: {
                        name: data.username,
                        email: data.email,
                    },
                },
                headers: getRequestHeaders(),
            })
            .catch((error) => {
                console.error("[error:server] updateSession", error)
                return null
            })

        return { success: Boolean(response?.success) }
    })
