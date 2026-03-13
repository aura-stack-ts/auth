import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    basePath: "/auth",
    cache: "no-store",
    credentials: "include",
})
