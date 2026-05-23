import { fetcher } from "@/shared/fetcher.ts"
import { resolveUrl } from "@/shared/url.ts"
import { DeviceOAuthError } from "@/shared/errors.ts"
import type { DeviceProviderCredentials } from "@/@types/device.ts"
import type { User } from "@/@types/session.ts"

const getDefaultUser = (profile: Record<string, unknown>): User => {
    const sub =
        profile.id?.toString() ??
        (profile.sub as string | undefined) ??
        (profile.uid as string | undefined) ??
        (profile.user_id as string | undefined)
    if (!sub) {
        throw new DeviceOAuthError("invalid_request", "OAuth provider did not return a stable user identifier (id/sub/uid).")
    }
    return {
        sub,
        email: (profile.email as string | null | undefined) ?? null,
        name: (profile.name as string | null | undefined) ?? (profile.username as string | null | undefined) ?? null,
        image: (profile.image as string | null | undefined) ?? (profile.picture as string | null | undefined) ?? null,
    }
}

export const getUserInfo = async <DefaultUser extends User = User>(
    provider: DeviceProviderCredentials<Record<string, unknown>, DefaultUser>,
    accessToken: string
): Promise<DefaultUser> => {
    const userinfoURL = resolveUrl(provider.userInfo)
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

    const profile = (await response.json()) as Record<string, unknown>
    if (provider.profile) {
        return provider.profile(profile)
    }
    return getDefaultUser(profile) as DefaultUser
}
