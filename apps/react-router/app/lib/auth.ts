import { createAuth } from "@aura-stack/react-router"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/react-router/oauth"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const {
    api,
    core: { handlers },
} = createAuth({
    oauth,
    basePath: "/api/auth",
})
