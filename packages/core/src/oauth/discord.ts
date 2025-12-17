import type { OAuthProviderConfig } from "@/@types/index.js"

/**
 * @see [Discord - Nameplate Object](https://discord.com/developers/docs/resources/user#nameplate-nameplate-structure)
 */
export interface Nameplate {
    sku_id: string
    asset: string
    label: string
    palette: string
}

/**
 * The `snowflake` type is a string type. The attributes defined with this type are:
 * - `id`: The unique identifier for the object.
 * - `primary_guild.identity_guild_id`: The unique identifier for the guild.
 * - `avatar_decoration_data.sku_id`: The unique identifier for the SKU.
 *
 * @see [Discord - User Object](https://discord.com/developers/docs/resources/user#user-object)
 */
export interface DiscordProfile {
    id: string
    username: string
    discriminator: string
    global_name: string | null
    avatar: string | null
    bot?: boolean
    system?: boolean
    mfa_enabled?: boolean
    banner?: string | null
    accent_color?: number | null
    locale?: string
    verified?: boolean
    email?: string | null
    flags?: number
    premium_type?: number
    public_flags?: number
    avatar_decoration_data?: {
        asset: string
        sku_id: string
    }
    collections?: Record<string, Nameplate>
    primary_guild?: {
        identity_guild_id: string
        identity_enabled: boolean | null
        tag: string | null
        badge: string | null
    }
}

/**
 * @see [Discord - Applications](https://discord.com/developers/applications)
 * @see [Discord - OAuth2](https://discord.com/developers/docs/topics/oauth2)
 * @see [Discord - Get Current User](https://discord.com/developers/docs/resources/user#get-current-user)
 * @see [Discord - User Object](https://discord.com/developers/docs/resources/user#user-object)
 * @see [Discord - OAuth2 Scopes](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes)
 * @see [Discord - Image Formatting](https://discord.com/developers/docs/reference#image-formatting)
 */
export const discord: OAuthProviderConfig<DiscordProfile> = {
    id: "discord",
    name: "Discord",
    authorizeURL: "https://discord.com/oauth2/authorize",
    accessToken: "https://discord.com/api/oauth2/token",
    userInfo: "https://discord.com/api/users/@me",
    scope: "identify email",
    responseType: "code",
    profile(profile) {
        let image = ""
        if (profile.avatar === null) {
            const index = profile.discriminator === "0" ? (BigInt(profile.id) >> 22n) % 6n : Number(profile.discriminator) % 5
            image = `https://cdn.discordapp.com/embed/avatars/${index}.png`
        } else {
            const format = profile.avatar.startsWith("a_") ? "gif" : "png"
            image = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
        }
        return {
            sub: profile.id,
            // https://discord.com/developers/docs/change-log#display-names
            name: profile.global_name ?? profile.username,
            email: profile.email ?? "",
            image,
        }
    },
}
