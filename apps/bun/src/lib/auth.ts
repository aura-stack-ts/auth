import { createAuth } from "@aura-stack/auth"

export const { handlers, jose, api } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
})
