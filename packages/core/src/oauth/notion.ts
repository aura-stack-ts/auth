import { OAuthProviderConfig } from "@/@types/index.js"

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
 * @todo: It's required to pass the Notion-Version header to access the user info endpoint.
 */
export const notion: OAuthProviderConfig<NotionProfile> = {
    id: "notion",
    name: "Notion",
    authorizeURL: "https://api.notion.com/v1/oauth/authorize?owner=user",
    accessToken: "https://api.notion.com/v1/oauth/token",
    userInfo: "https://api.notion.com/v1/users/me",
    scope: "user:read",
    responseType: "code",
}
