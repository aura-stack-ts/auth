import { createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { handlers, jose } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "https://*.vercel.app"],
})
