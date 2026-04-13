import { createAuthClient } from "@aura-stack/react-router/client"

export const authClient = createAuthClient({
    baseURL: "http://localhost:5173",
    basePath: "/api/auth",
})
