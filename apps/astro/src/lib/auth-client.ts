import { createAuthClient } from "@aura-stack/react"

export const authClient = createAuthClient({
    basePath: "/api/auth",
    baseURL: "http://localhost:4321",
})
