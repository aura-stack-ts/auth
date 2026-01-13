import type { OAuthProviderConfig } from "@/@types/index.js"

export type AccountType = "basic" | "pro" | "business"

export interface Name {
    given_name: string
    surname: string
    familiar_name: string
    display_name: string
    abbreviated_name: string
}

export interface RootInfo {
    team: RootInfo
    user: RootInfo
}

export interface FullTeam {
    id: string
    name: string
    sharing_policies: Record<string, unknown>
    office_addin_policy: unknown
    top_level_content_policy: unknown
}

export interface DropboxProfile {
    account_id: string
    name: Name
    email: string
    email_verified: boolean
    disabled: boolean
    locale: string
    referral_link: string
    is_paired: boolean
    account_type: AccountType
    root_info: unknown
    profile_photo_url?: string
    country: string
    team?: unknown
    team_member_id?: string
}

/**
 * @see [Dropbox - OAuth Guide](https://developers.dropbox.com/oauth-guide)
 * @see [Dropbox - API v2](https://www.dropbox.com/developers/documentation/http/documentation)
 * @see [Dropbox - Get Current Account](https://www.dropbox.com/developers/documentation/http/documentation#users-get_current_account)
 * @see [Dropbox - My Apps](https://www.dropbox.com/developers/apps)
 * @see [Dropbox - Developer Guide](https://www.dropbox.com/developers/reference/developer-guide)
 */
export const dropbox: OAuthProviderConfig<DropboxProfile> = {
    id: "dropbox",
    name: "Dropbox",
    authorizeURL: "https://www.dropbox.com/oauth2/authorize",
    accessToken: "https://api.dropboxapi.com/oauth2/token",
    userInfo: "https://api.dropboxapi.com/2/users/get_current_account",
    scope: "account_info.read",
    responseType: "code",
    profile(profile) {
        return {
            sub: profile.account_id,
            name: profile.name.display_name,
            email: profile.email,
            image: profile.profile_photo_url,
        }
    },
}
