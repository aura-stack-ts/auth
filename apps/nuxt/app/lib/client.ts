import { createAuthClient as createBaseAuthClient } from "@aura-stack/auth"

export const authClient = createBaseAuthClient({
    basePath: "/api/auth",
})
