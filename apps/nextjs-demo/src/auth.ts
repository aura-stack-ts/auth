import { createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as Array<keyof typeof builtInOAuthProviders>

export const auth = createAuth({
    oauth,
    trustedProxyHeaders: true,
})
