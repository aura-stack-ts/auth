import { getEnv } from "@/shared/env.ts"
import { merge } from "@/shared/utils.ts"
import { createAuth } from "@/createAuth.ts"
import { oauthCustomService, oauthCustomServiceProfile, openIDCustomProvider } from "@test/setup/presets.ts"
import type { AuthConfig, DatabaseAdapter, User } from "@/@types/index.ts"

const auth = createAuth({
    oauth: [oauthCustomService, oauthCustomServiceProfile, openIDCustomProvider],
    logger: getEnv("CI") === "true" ? false : true,
    credentials: {
        authorize: async ({ credentials }) => {
            const { username } = credentials
            return {
                sub: "1234567890",
                email: `${username}@example.com`,
                name: username,
                image: "https://example.com/image.jpg",
            }
        },
    },
    signUp: {
        onCreateUser: ({ payload }) => {
            const { name, email, image } = payload
            return {
                sub: "1234567890",
                name,
                email,
                image,
            } as User
        },
    },
})

export const {
    handlers: { GET, POST, PATCH },
    jose,
    api,
} = auth

export const authInstance = (adapter?: Partial<Record<keyof DatabaseAdapter, any>>, override?: Partial<AuthConfig<any, any>>) => {
    const config: AuthConfig<any, any> = {
        oauth: [oauthCustomService, oauthCustomServiceProfile, openIDCustomProvider],
        logger: getEnv("CI") === "true" ? false : true,
        session: {
            strategy: "database",
            adapter: adapter ?? ({} as any),
        },
        credentials: {
            authorize: async ({ credentials }) => {
                return {
                    sub: "user-123",
                    name: credentials.username,
                    email: `${credentials.username}@example.com`,
                    image: "https://example.com/image.jpg",
                }
            },
        },
        signUp: {
            onCreateUser: async ({ payload }) => {
                return {
                    sub: "user-123",
                    name: payload.name,
                    email: payload.email,
                    image: payload.image,
                }
            },
        },
    }
    const merged = merge(config, override ?? {})
    return createAuth(merged as any)
}
