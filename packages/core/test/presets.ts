import { createAuth } from "@/createAuth.ts"
import type { JWTPayload } from "@/jose.ts"
import type { OAuthProviderCredentials } from "@/@types/index.ts"

export const oauthCustomService: OAuthProviderCredentials = {
    id: "oauth-provider",
    name: "OAuth",
    authorize: "https://example.com/oauth/authorize",
    accessToken: "https://example.com/oauth/access_token",
    scope: "profile email",
    responseType: "code",
    userInfo: "https://example.com/oauth/userinfo",
    clientId: "oauth_client_id",
    clientSecret: "oauth_client_secret",
}

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

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
}

const auth = createAuth({
    oauth: [oauthCustomService, oauthCustomServiceProfile],
    logger: true,
    credentials: {
        authorize: async () => {
            return {
                sub: "1234567890",
                email: "johndoe@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }
        },
    },
})

export const {
    handlers: { GET, POST, PATCH },
    jose,
    api,
} = auth
