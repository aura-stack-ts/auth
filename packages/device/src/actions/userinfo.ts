import { fetcher } from "@/shared/fetcher.ts"
import { getResolvedURL } from "@/shared/url.ts"
import { DeviceOAuthError } from "@/shared/errors.ts"
import type { User } from "@/@types/session.ts"
import type { DeviceProviderCredentials } from "@/@types/device.ts"

export const getUserInfo = async <DefaultUser extends User = User>(
    provider: DeviceProviderCredentials<Record<string, unknown>, DefaultUser>,
    accessToken: string
): Promise<DefaultUser> => {
    const userinfoURL = getResolvedURL(provider.userInfo)
    const response = await fetcher(userinfoURL, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new DeviceOAuthError("server_error", `Failed to fetch user information (${response.status}).`)
    }

    let profile: Record<string, unknown>
    try {
        profile = (await response.json()) as Record<string, unknown>
    } catch {
        throw new DeviceOAuthError("server_error", "Failed to parse user information response.")
    }

    if (provider.profile) {
        return provider.profile(profile)
    }
    throw new DeviceOAuthError(
        "invalid_request",
        "OAuth provider does not have a profile function to parse user information. Please provide a profile function in the provider configuration."
    )
}
