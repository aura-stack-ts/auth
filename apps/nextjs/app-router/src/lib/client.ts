import { createAuthClient } from "@aura-stack/auth/client"

export const client = createAuthClient({
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
