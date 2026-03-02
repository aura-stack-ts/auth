import { createBasicAuthHeader } from "@/utils.ts"
import type { OAuthProviderCredentials } from "@/@types/index.ts"

export interface Person {
    email: string
}

export interface User {
    object: "user"
    id: string
    name: string
    avatar_url: string | null
    type: "person"
    person: Person
}

export interface Owner {
    type: "user"
    user: User
}

export interface Bot {
    owner: Owner
}

/**
 * @see [Notion - Retrieve your token's bot user](https://developers.notion.com/reference/get-self)
 */
export interface NotionProfile {
    object: "user"
    id: string
    name: string
    avatar_url: string | null
    type: "bot"
    bot: Bot
}

/**
 * @see [Notion - Developer Documentation](https://developers.notion.com/)
 * @see [Notion - Authorization](https://developers.notion.com/docs/authorization)
 * @see [Notion - Authentication](https://developers.notion.com/reference/authentication)
 * @see [Notion - Retrieve your token's bot user](https://developers.notion.com/reference/get-self)
 */
export const notion = (options?: Partial<OAuthProviderCredentials<NotionProfile>>): OAuthProviderCredentials<NotionProfile> => {
    return {
        id: "notion",
        name: "Notion",
        authorize: {
            url: "https://api.notion.com/v1/oauth/authorize",
            params: {
                owner: "user",
                scope: "user:read",
                responseType: "code",
            },
        },
        accessToken: {
            url: "https://api.notion.com/v1/oauth/token",
            headers: {
                Authorization: createBasicAuthHeader(
                    options?.clientId ?? "NOTION_CLIENT_ID",
                    options?.clientSecret ?? "NOTION_CLIENT_SECRET"
                ),
            },
        },
        userInfo: {
            url: "https://api.notion.com/v1/users/me",
            headers: {
                "Notion-Version": "2022-06-28",
            },
        },
        profile(profile) {
            return {
                sub: profile.id,
                name: profile.name,
                image: profile.avatar_url ?? "",
                email: profile?.bot?.owner?.user?.person?.email,
            }
        },
        ...options,
    } as OAuthProviderCredentials<NotionProfile>
}
