import { describe, expectTypeOf } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { AuthConfig, AuthInstance, JoseInstance, OAuthProviderCredentials, User } from "@/index.ts"
import { github, GitHubProfile } from "@/oauth/github.ts"

describe("createAuth", () => {
    expectTypeOf(createAuth).parameter(0).toEqualTypeOf<AuthConfig>()
    expectTypeOf(createAuth).toEqualTypeOf<<DefaultUser extends User = User>(config: AuthConfig) => AuthInstance<DefaultUser>>()
    expectTypeOf(createAuth<User & { role: string }>).returns.toEqualTypeOf<AuthInstance<User & { role: string }>>()
    expectTypeOf(createAuth<User & { role: string }>({ oauth: [] })["jose"]).toEqualTypeOf<
        JoseInstance<User & { role: string }>
    >()
})

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
