import { describe, expectTypeOf } from "vitest"
import type { User } from "@/index.ts"
import { github, type GitHubProfile } from "@/oauth/github.ts"
import type { OAuthProviderCredentials } from "@/@types/oauth.ts"

describe("OAuth providers", () => {
    expectTypeOf(github).toEqualTypeOf<
        <DefaultUser extends User = User>(
            options?: Partial<OAuthProviderCredentials<GitHubProfile, DefaultUser>>
        ) => OAuthProviderCredentials<GitHubProfile, DefaultUser>
    >()
    expectTypeOf(github().profile).toEqualTypeOf<((profile: GitHubProfile) => User | Promise<User>) | undefined>()
    expectTypeOf(github<User & { role: string }>).toEqualTypeOf<
        (
            options?: Partial<OAuthProviderCredentials<GitHubProfile, User & { role: string }>>
        ) => OAuthProviderCredentials<GitHubProfile, User & { role: string }>
    >()
    expectTypeOf(github<User & { role: string }>().profile).toEqualTypeOf<
        ((profile: GitHubProfile) => (User & { role: string }) | Promise<User & { role: string }>) | undefined
    >()
})
