import { createAuthClient } from "@aura-stack/tanstack-start/client"

export const authClient = createAuthClient({
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
