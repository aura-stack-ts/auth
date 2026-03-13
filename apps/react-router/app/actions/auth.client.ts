import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
    baseURL: "http://localhost:5173",
    basePath: "/auth",
})
