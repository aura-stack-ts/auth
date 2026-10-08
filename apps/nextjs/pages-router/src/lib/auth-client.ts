import { createAuthClient } from "@aura-stack/next/client"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",
})
