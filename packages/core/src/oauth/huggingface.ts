import type { OpenIDProvider, User } from "@/@types/index.ts"

export interface HuggingFaceResourceGroup {
    sub: string
    name: string
    role: "admin" | "write" | "contributor" | "read" | "no_access"
}

export interface HuggingFaceOrg {
    sub: string
    name: string
    picture: string
    preferred_username: string
    plan?: "team" | "enterprise" | "plus" | "academia"
    canPay?: boolean
    billingMode?: "prepaid" | "postpaid"
    roleInOrg?: "admin" | "write" | "contributor" | "read" | "no_access"
    pendingSSO?: boolean
    missingMFA?: boolean
    securityRestrictions?: ("mfa" | "token-policy" | "token-revoked" | "sso" | "ip")[]
    resourceGroups?: HuggingFaceResourceGroup
}

/**
 * @see [Hugging Face - Open API Metadata](https://huggingface.co/.well-known/openapi.json)
 */
export interface HuggingFaceProfile {
    sub: string
    isPro: boolean
    orgs: HuggingFaceOrg[]
    name?: string
    preferred_username?: string
    picture?: string
    profile?: string
    website?: string
    email?: string
    email_verified?: boolean
    canPay?: boolean
    billingMode?: "prepaid" | "postpaid"
}

/**
 * Hugging Face OpenID Connect Provider
 *
 * @see [Hugging Face - Sign in with Hugging Face](https://huggingface.co/docs/hub/en/oauth)
 * @see [Hugging Face - Create an OAuth App](https://huggingface.co/settings/applications/new)
 * @see [Hugging Face - OpenID Metadata](https://huggingface.co/.well-known/openid-configuration)
 */
export const huggingface = <DefaultUser extends User = User>(
    options?: Partial<OpenIDProvider<HuggingFaceProfile, DefaultUser>>
): OpenIDProvider<HuggingFaceProfile, DefaultUser> => {
    return {
        id: "huggingface",
        name: "Hugging Face",
        issuer: "https://huggingface.co",
        profile: (profile) =>
            ({
                sub: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }) as DefaultUser,
        ...options,
    }
}