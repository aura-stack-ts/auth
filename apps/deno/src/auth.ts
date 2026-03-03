import { type AuthInstance, createAuth } from "@aura-stack/auth"

export const { handlers, jose, server }: AuthInstance = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
}) 
