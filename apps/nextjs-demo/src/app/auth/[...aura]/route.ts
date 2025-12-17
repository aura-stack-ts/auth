import { createAuth } from "@aura-stack/auth"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"

const oauth = Object.keys(builtInOAuthProviders) as Array<keyof typeof builtInOAuthProviders>

const auth = createAuth({
    oauth,
    trustedProxyHeaders: true,
})

const {
    handlers: { GET, POST },
} = auth

export { GET, POST }
