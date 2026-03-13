import { createAuthClient as createBaseAuthClient } from "@aura-stack/auth"

const authClient = createBaseAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})

export const { getSession, signIn, signOut } = authClient
