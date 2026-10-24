import type {
    AccountEntity,
    DeviceEntity,
    OAuthAccountEntity,
    OAuthTransactionEntity,
    SessionEntity,
    SessionWithUserEntity,
    UserEntity,
    VerificationTokenEntity,
} from "@/@types/index.ts"

export const userEntity: UserEntity = {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    emailVerifiedAt: new Date(),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    attributes: null,
    deletedAt: null,
}

export const sessionEntity: SessionEntity = {
    id: "session-123",
    userId: "user-123",
    deviceId: null,
    authenticatedWith: "credentials",
    status: "active",
    mfaState: "none",
    tokenHash: "hashed-token",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    lastActivityAt: new Date(),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
}

export const sessionEntityWithUser: SessionWithUserEntity = {
    ...sessionEntity,
    user: userEntity,
}

export const oauthAccountEntity: OAuthAccountEntity = {
    accountId: "account-123",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    idToken: "id-token",
    tokenType: "Bearer",
    scopes: "scope1 scope2",
    issuer: "https://example.com",
    accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
    updatedAt: new Date(),
}

export const accountEntity: Partial<AccountEntity> = {
    id: "account-123",
    status: "active",
    provider: "oauth-provider",
    userId: "user-123",
}

export const deviceEntity: DeviceEntity = {
    id: "device-123",
    userId: userEntity.id,
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    browser: "Chrome",
    platform: "Windows",
    name: "John's Laptop",
    type: "desktop",
    lastIp: "192.168.1.1",
    fingerprint: "fingerprint-123",
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    trusted: false,
    deletedAt: null,
}

export const oauthTransactionEntity: OAuthTransactionEntity = {
    id: "transaction-123",
    provider: "oauth-provider",
    state: "abc",
    nonce: null,
    codeVerifier: "verifier_123",
    redirectURI: "https://example.com/auth/callback/oauth-provider",
    redirectTo: "/auth",
    userAgent: null,
    fingerprint: null,
    deviceId: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
}

export const verificationTokenEntity: VerificationTokenEntity = {
    id: "token-123",
    userId: "user-123",
    tokenHash: "hashed-verification-token",
    type: "email_verification",
    identifier: "john@example.com",
    newIdentifier: null,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
}
