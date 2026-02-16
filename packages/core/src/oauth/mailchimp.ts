import type { OAuthProviderCredentials } from "@/@types/index.js"

export interface Login {
    email: string
    avatar: string | null
    login_id: number
    login_name: string
    login_email: string
}

/**
 * @see [Mailchimp - API Root](https://mailchimp.com/developer/marketing/api/authentication/)
 */
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
 * Mailchimp OAuth Provider
 * @see [Mailchimp - Marketing API](https://mailchimp.com/developer/marketing/api/)
 * @see [Mailchimp - Apps](https://us1.admin.mailchimp.com/account/oauth2/)
 * @see [Mailchimp - Create an Application](https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/#register-your-app)
 * @see [Mailchimp - OAuth 2.0 Docs](https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/)
 * @see [Mailchimp - API Root](https://mailchimp.com/developer/marketing/api/root/)
 */
export const mailchimp = (
    options?: Partial<OAuthProviderCredentials<MailchimpProfile>>
): OAuthProviderCredentials<MailchimpProfile> => {
    return {
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
                email: profile.login.email,
                image: profile.login.avatar,
            }
        },
        ...options,
    } as OAuthProviderCredentials<MailchimpProfile>
}
