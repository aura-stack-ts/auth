import { createAuth, type AuthInstance } from "@aura-stack/auth"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { handlers, jose, api }: AuthInstance = createAuth({
    // Built-in OAuth providers configured. For testing, only GitHub is enabled.
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "https://*.vercel.app"],
})
