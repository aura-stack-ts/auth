import { createAuth, builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/next"

export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]
export const providers = [builtInOAuthProviders.github(), builtInOAuthProviders.gitlab(), builtInOAuthProviders.bitbucket()]

export const { api, core } = createAuth({
    oauth,
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
