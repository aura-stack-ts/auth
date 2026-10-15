import type { JWTPayload } from "@/jose.ts"
import type { OAuthProviderCredentials, OAuthTokenPayload, OpenIDProvider } from "@/@types/index.ts"

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
}

export const oauthCustomService: OAuthProviderCredentials = {
    id: "oauth-provider",
    name: "OAuth",
    authorize: "https://example.com/oauth/authorize",
    accessToken: "https://example.com/oauth/access_token",
    scope: "profile email",
    responseType: "code",
    userInfo: "https://example.com/oauth/userinfo",
    refreshToken: "https://example.com/oauth/refresh_token",
    clientId: "oauth_client_id",
    clientSecret: "oauth_client_secret",
    revokeToken: "https://example.com/oauth/revoke_token",
}

export const openIDCustomProvider: OpenIDProvider = {
    id: "oidc-provider",
    name: "OIDC",
    issuer: "https://id.example.com",
    clientId: "oidc_client_id",
    clientSecret: "oidc_client_secret",
}

export const openIDMetadata = {
    issuer: "https://id.example.com",
    authorization_endpoint: "https://id.example.com/oauth/authorize",
    token_endpoint: "https://id.example.com/oauth/token",
    userinfo_endpoint: "https://id.example.com/oauth/userinfo",
    jwks_uri: "https://id.example.com/oauth/jwks",
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
} as const

export const oauthTokens = {
    accessToken: "access-token",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    refreshToken: "refresh-token",
    refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 7200,
    issuedAt: Math.floor(Date.now() / 1000),
    scopes: ["scope1", "scope2"],
    tokenType: "Bearer",
} as OAuthTokenPayload

export const oauthCustomServiceProfile: OAuthProviderCredentials = {
    ...oauthCustomService,
    id: "oauth-profile",
    profile(profile) {
        return {
            sub: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.image,
            nickname: profile.nickname,
            email_verified: profile.email_verified,
        }
    },
}
