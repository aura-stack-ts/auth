import { createAuthClient } from "@aura-stack/auth/client"

export const client = createAuthClient({
    basePath: "/api/auth",
})
