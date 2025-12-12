import { integrations } from "@aura-stack/auth/oauth/index"
import { OAuthProvider } from "@/app/lib/@types/props"

export const providers = Object.entries(integrations).reduce((previous, [oauth, config]) => {
    const clientIdInput = Boolean(process.env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_ID`])
    const clientSecretInput = Boolean(process.env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_SECRET`])
    const { profile, scope, ...exclude } = config
    return [
        ...previous,
        {
            scopes: config.scope.split(" "),
            redirectURI: `http://localhost:3000/auth/callback/${oauth}`,
            configured: clientIdInput && clientSecretInput,
            clientIdInput,
            clientSecretInput,
            ...exclude,
        } as OAuthProvider,
    ]
}, [] as Array<OAuthProvider>)
