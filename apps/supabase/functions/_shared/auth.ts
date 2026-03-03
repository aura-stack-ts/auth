import { type AuthInstance, createAuth } from "@aura-stack/auth"

export const { handlers, jose }: AuthInstance = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
}) 
