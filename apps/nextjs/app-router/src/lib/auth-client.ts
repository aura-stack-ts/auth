import { createAuthClient } from "@aura-stack/next/client"

export const authClient = createAuthClient({
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
