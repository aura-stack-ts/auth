import { createAuth } from "@aura-stack/next"
//import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@aura-stack/next/oauth"
//console.log("Built-in OAuth providers:", builtInOAuthProviders)

//export const oauth = Object.keys(builtInOAuthProviders) as BuiltInOAuthProvider[]
export const oauth = []
//export const providers = [builtInOAuthProviders.github(), builtInOAuthProviders.gitlab(), builtInOAuthProviders.bitbucket()]
export const providers = [{}, {}, {}]

export const { api, core } = createAuth({
    oauth,
    basePath: "/api/auth",
    baseURL: "http://localhost:3000",
})
