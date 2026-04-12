import { createAuth } from "@aura-stack/react/server"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const { api, handlers } = createAuth({
    oauth,
    basePath: "/api/auth",
})
