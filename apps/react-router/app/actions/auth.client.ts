import { createAuthClient as createBaseAuthClient } from "@aura-stack/auth"

const authClient = createBaseAuthClient({
    baseURL: window.location.origin,
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const { getSession, signIn, signOut } = authClient

export const createAuthClient = {
    getSession,
    signIn,
    signOut,
}
