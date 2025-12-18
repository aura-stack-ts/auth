import { createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"

export const oauth = Object.keys(builtInOAuthProviders) as Array<keyof typeof builtInOAuthProviders>

export const auth = createAuth({
    oauth,
    secret: process.env.AURA_AUTH_SECRET ?? process.env.NEXT_PUBLIC_AURA_AUTH_SECRET,
    trustedProxyHeaders: true,
})
