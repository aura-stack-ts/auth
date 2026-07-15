import { createAuth } from "@/createAuth.ts"
import type { IdentityConfig } from "@/@types/config.ts"
import type { DatabaseAdapter } from "@/@types/adapter.ts"
import type { SessionEntity, UserEntity } from "@/@types/entities.ts"

export const userPayload: UserEntity = {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    emailVerifiedAt: new Date(),
    status: "active",
    mfaEnabled: false,
    mfaPreferredMethod: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attributes: null,
}

export const sessionPayload: SessionEntity & { user: UserEntity } = {
    id: "session-123",
    userId: "user-123",
    deviceId: null,
    authenticatedWith: "credentials",
    status: "active",
    mfaState: "none",
    tokenHash: "hashed-token",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    metadata: null,
    lastActivityAt: new Date(),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: userPayload,
}

export const authInstance = (
    functions: Partial<Record<keyof DatabaseAdapter, any>>,
    identityConfig: Partial<IdentityConfig<any>> = {}
) => {
    const { handlers } = createAuth({
        oauth: [],
        session: {
            strategy: "database",
            adapter: functions as any,
        },
        credentials: {
            authorize: async ({ credentials }) => ({
                sub: "user-123",
                name: credentials.username,
                email: credentials.password,
                image: "https://example.com/image.jpg",
            }),
        },
        logger: true,
        identity: identityConfig,
    })
    return handlers
}
