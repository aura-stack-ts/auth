import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"
import { OAuthProvider } from "@/app/lib/@types/props"

export const providers = Object.entries(builtInOAuthProviders).reduce((previous, [oauth, config]) => {
    const env = process.env
    const clientIdSuffix = `${oauth.toUpperCase()}_CLIENT_ID`
    const clientSecretSuffix = `${oauth.toUpperCase()}_CLIENT_SECRET`

    const clientIdInput = Boolean(env[`AURA_AUTH_${clientIdSuffix}`] ?? env[`AUTH_${clientIdSuffix}`] ?? env[`${clientIdSuffix}`])
    const clientSecretInput = Boolean(
        env[`AURA_AUTH_${clientSecretSuffix}`] ?? env[`AUTH_${clientSecretSuffix}`] ?? env[`${clientSecretSuffix}`]
    )
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
