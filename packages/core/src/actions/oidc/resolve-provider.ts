import { discoveryMetadata } from "@/actions/oidc/discovery.ts"
import type { OpenIDProvider } from "@/@types/oidc.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"
import { setDynamicParams } from "@/oauth/index.ts"

const DEFAULT_OIDC_SCOPE = "openid profile email"

const resolvedProviderCache = new Map<string, RuntimeOAuthProvider>()

export const isOIDCProvider = (provider: { oidc?: { issuer: string } }): boolean => {
    return provider.oidc !== undefined
}

export const resolveOpenIDProvider = async (provider: RuntimeOAuthProvider): Promise<RuntimeOAuthProvider> => {
    const cached = resolvedProviderCache.get(provider.id)
    if (cached) {
        return cached
    }

    let issuer = provider.oidc?.issuer
    if (!issuer) {
        throw new Error("OIDC provider is missing issuer configuration: " + provider.id)
    }
    issuer = setDynamicParams(issuer, provider as unknown as Record<string, unknown>)

    const metadata = await discoveryMetadata(issuer)
    const scope =
        typeof provider.authorize === "object" && provider.authorize.params?.scope
            ? provider.authorize.params.scope
            : DEFAULT_OIDC_SCOPE

    const resolved: RuntimeOAuthProvider = {
        ...provider,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        authorize: {
            url: metadata.authorization_endpoint,
            params: {
                responseType: "code",
                scope,
            },
        },
        accessToken: metadata.token_endpoint,
        userInfo: metadata.userinfo_endpoint,
        refreshToken: metadata.token_endpoint,
        oidc: {
            issuer: metadata.issuer,
            jwks_uri: metadata.jwks_uri,
        },
    }

    resolvedProviderCache.set(provider.id, resolved)
    return resolved
}

export const createOpenIDPlaceholder = (
    config: OpenIDProvider,
    credentials: { clientId: string; clientSecret: string }
): RuntimeOAuthProvider => {
    const scope = config.scope ?? DEFAULT_OIDC_SCOPE
    return {
        id: config.id,
        name: config.name,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        profile: config.profile,
        authorize: {
            url: "",
            params: { responseType: "code", scope },
        },
        accessToken: "",
        userInfo: "",
        refreshToken: "",
        refreshWindow: config.refreshWindow,
        oidc: {
            issuer: setDynamicParams(config.issuer, config),
        },
    }
}

export const clearResolvedProviderCache = (): void => {
    resolvedProviderCache.clear()
}
