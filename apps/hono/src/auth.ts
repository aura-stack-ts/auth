import { AuthInstance, createAuth } from "@aura-stack/auth"

export const { handlers, jose } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
}) as AuthInstance
