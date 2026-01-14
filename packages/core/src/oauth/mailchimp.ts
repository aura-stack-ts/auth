import { OAuthProviderConfig } from "@/@types/index.js"

export interface MailchimpProfile {}

export const mailchimp: OAuthProviderConfig<MailchimpProfile> = {
    id: "mailchimp",
    name: "Mailchimp",
    authorizeURL: "https://login.mailchimp.com/oauth2/authorize",
    accessToken: "https://login.mailchimp.com/oauth2/token",
    userInfo: "https://login.mailchimp.com/oauth2/metadata",
    scope: "",
    responseType: "code",
}
