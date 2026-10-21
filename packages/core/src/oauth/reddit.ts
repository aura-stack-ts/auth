import { merge } from "@/shared/utils.ts"
import type { DeepPartial, OAuthProviderCredentials, User } from "@/@types/index.ts"

export interface RedditProfile {}

/**
 * Reddit OAuth provider.
 *
 * @see [Reddit - Apps Portal](https://www.reddit.com/prefs/apps/)
 * @see [Reddit - API Documentation](https://www.reddit.com/dev/api/oauth/)
 *
 */
export const reddit = <DefaultUser extends User = User>(
    options?: DeepPartial<OAuthProviderCredentials<RedditProfile, DefaultUser>>
): OAuthProviderCredentials<RedditProfile, DefaultUser> => {
    return merge(
        {
            id: "reddit",
            name: "Reddit",
            authorize: {
                url: "https://www.reddit.com/api/v1/authorize",
                params: {
                    scope: "identity",
                },
            },
            accessToken: "https://www.reddit.com/api/v1/access_token",
            userInfo: "https://www.reddit.com/api/v1/user/me",
        },
        options
    )
}
