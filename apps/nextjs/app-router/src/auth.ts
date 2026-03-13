import { type AuthInstance, createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]
export const providers = [builtInOAuthProviders.github(), builtInOAuthProviders.gitlab(), builtInOAuthProviders.bitbucket()]

export const { handlers, jose, api }: AuthInstance = createAuth({
    oauth,
    basePath: "/api/auth",
})
