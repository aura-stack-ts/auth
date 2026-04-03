import { createAuthClient } from "@aura-stack/auth/client"

export const authClient = createAuthClient({
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
