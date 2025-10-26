import { object, string, enum as options } from "zod/v4"

export const OAuthConfigSchema = object({
    authorizeURL: string(),
    accessToken: string(),
    scope: string().optional(),
    userInfo: string(),
    responseType: options(["code", "token", "id_token"]),
    clientId: string(),
    clientSecret: string(),
})

export const OAuthRandomSecure = object({
    state: string(),
    code: string(),
})

export const StateSchema = string()
export const CodeSchema = string()
export const RedirectURISchema = string()
