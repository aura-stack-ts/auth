import { createAuthClient } from "@aura-stack/react"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",
})
