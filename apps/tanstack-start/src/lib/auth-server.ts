import { api } from "@/auth"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders, setResponseHeaders } from "@tanstack/react-start/server"

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    try {
        const session = await api.getSession({
            headers: getRequestHeaders(),
        })
        if (!session.authenticated) return null
        return session.session as any
    } catch (error) {
        console.log("[error:server] getSession", error)
        return null
    }
})

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
    try {
        const response = await api.signOut({
            headers: getRequestHeaders(),
        })
        setResponseHeaders(response.headers)
        const json = await response.json()
        return json
    } catch (error) {
        console.log("[error:server] signOut", error)
        return null
    }
})
