import type { OAuthProviderConfig } from "@/@types/index.js"

export interface Login {
    email: string
    avatar: string | null
    login_id: number
    login_name: string
    login_email: string
}

export interface MailchimpProfile {
    dc: string
    role: string
    accountname: string
    user_id: string
    login: Login
    login_url: string
    api_endpoint: string
}

/**
 * @see [Mailchimp - Access Data on Behalf of Other Users with OAuth 2](https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/)
 */
export const mailchimp: OAuthProviderConfig<MailchimpProfile> = {
    id: "mailchimp",
    name: "Mailchimp",
    authorizeURL: "https://login.mailchimp.com/oauth2/authorize",
    accessToken: "https://login.mailchimp.com/oauth2/token",
    userInfo: "https://login.mailchimp.com/oauth2/metadata",
    scope: "",
    responseType: "code",
    profile(profile) {
        return {
            sub: profile.user_id,
            name: profile.accountname,
            email: profile.login.login_email,
            image: null,
        }
    },
}
