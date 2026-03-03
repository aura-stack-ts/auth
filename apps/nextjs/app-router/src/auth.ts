import { type AuthInstance, createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { handlers, jose }: AuthInstance = createAuth({
    oauth,
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
})
