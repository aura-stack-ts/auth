import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://127.0.0.1:8787", "http://localhost:8787"],
})
