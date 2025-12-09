import { createAuth } from "@/index.js"
import { SESSION_VERSION } from "@/actions/session/session.js"
import { CookieOptionsInternal, OAuthSecureConfig } from "@/@types/index.js"
import type { JWTPayload } from "@/jose.js"

export const oauthCustomService: OAuthSecureConfig = {
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

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
    integrations: ["github"],
    version: SESSION_VERSION,
}

export const secureCookieOptions: CookieOptionsInternal = { secure: true, prefix: "__Secure-" }

export const hostCookieOptions: CookieOptionsInternal = { secure: true, prefix: "__Host-" }

export const {
    handlers: { GET, POST },
    jose,
} = createAuth({
    oauth: [oauthCustomService],
    cookies: {},
    secret: process.env.AURA_AUTH_SECRET,
})
