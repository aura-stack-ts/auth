import { createAuth } from "@/index.js"
import { OAuthProviderCredentials, CookieConfigInternal } from "@/@types/index.js"
import type { JWTPayload } from "@/jose.js"

export const oauthCustomService: OAuthProviderCredentials = {
    id: "oauth-integration",
    name: "OAuth",
    authorizeURL: "https://example.com/oauth/authorize",
    accessToken: "https://example.com/oauth/access_token",
    scope: "profile email",
    responseType: "code",
    userInfo: "https://example.com/oauth/userinfo",
    clientId: "oauth_client_id",
    clientSecret: "oauth_client_secret",
}

/**
 * @todo: Is this needed?
 */
export const oauthCustomServiceProfile: OAuthProviderCredentials = {
    ...oauthCustomService,
    id: "oauth-profile",
    profile(profile: any) {
        return {
            sub: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.image,
            username: profile.username,
            nickname: profile.nickname,
            email_verified: profile.email_verified,
        }
    },
}

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
}

export const secureCookieOptions: CookieConfigInternal = { secure: true, prefix: "__Secure-" }

export const hostCookieOptions: CookieConfigInternal = { secure: true, prefix: "__Host-" }

export const {
    handlers: { GET, POST },
    jose,
} = createAuth({
    oauth: [oauthCustomService, oauthCustomServiceProfile],
    cookies: {},
    secret: process.env.AURA_AUTH_SECRET,
})
