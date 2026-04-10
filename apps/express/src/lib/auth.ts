import { createAuth, builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/express"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]

export const auth = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
})

export const { api, jose, toHandler, withAuth } = auth
