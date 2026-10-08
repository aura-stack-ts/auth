import { createAuth } from "@aura-stack/oak"

export const { handlers, jose, api, toHandler, withAuth } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
})
