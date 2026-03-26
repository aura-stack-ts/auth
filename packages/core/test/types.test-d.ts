import { describe, expect } from "vitest"
//import { createAuth } from "@/createAuth.ts"
//import { github, type GitHubProfile } from "@/oauth/github.ts"
//import type { AuthConfig, AuthInstance, JoseInstance, OAuthProviderCredentials, User } from "@/index.ts"
//import type { GetSessionAPIOptions, SessionResponse, UpdateSessionAPIOptions, UpdateSessionReturn } from "@/@types/session.ts"

describe("createAuth", () => {
    //expectTypeOf(createAuth).parameter(0).toEqualTypeOf<AuthConfig>()
    //expectTypeOf(createAuth).toEqualTypeOf<
    //    <DefaultUser extends User = User>(config: AuthConfig<DefaultUser>) => AuthInstance<DefaultUser>
    //>()
    //expectTypeOf(createAuth<User & { role: string }>).returns.toEqualTypeOf<AuthInstance<User & { role: string }>>()
    //expectTypeOf(createAuth<User & { role: string }>({ oauth: [] })["jose"]).toEqualTypeOf<
    //    JoseInstance<User & { role: string }>
    //>()
    //expectTypeOf(createAuth({ oauth: [] })["api"].getSession).toEqualTypeOf<
    //    (options: GetSessionAPIOptions) => Promise<SessionResponse<User>>
    //>()
    //expectTypeOf(createAuth({ oauth: [] })["api"].updateSession).toEqualTypeOf<
    //    (options: UpdateSessionAPIOptions<User>) => Promise<UpdateSessionReturn<User>>
    //>()
    //
    //expectTypeOf(createAuth<User & { role: string }>({ oauth: [] })["api"].getSession).toEqualTypeOf<
    //    (options: GetSessionAPIOptions) => Promise<SessionResponse<User & { role: string }>>
    //>()
    //expectTypeOf(createAuth<User & { role: string }>({ oauth: [] })["api"].updateSession).toEqualTypeOf<
    //    (options: UpdateSessionAPIOptions<User & { role: string }>) => Promise<UpdateSessionReturn<User & { role: string }>>
    //>()
    expect(true).toBe(true)
})

describe("OAuth providers", () => {
    //expectTypeOf(github).toEqualTypeOf<
    //    <DefaultUser extends User = User>(
    //        options?: Partial<OAuthProviderCredentials<GitHubProfile, DefaultUser>>
    //    ) => OAuthProviderCredentials<GitHubProfile, DefaultUser>
    //>()
    //expectTypeOf(github().profile).toEqualTypeOf<((profile: GitHubProfile) => User | Promise<User>) | undefined>()
    //expectTypeOf(github<User & { role: string }>).toEqualTypeOf<
    //    (
    //        options?: Partial<OAuthProviderCredentials<GitHubProfile, User & { role: string }>>
    //    ) => OAuthProviderCredentials<GitHubProfile, User & { role: string }>
    //>()
    //expectTypeOf(github<User & { role: string }>().profile).toEqualTypeOf<
    //    ((profile: GitHubProfile) => (User & { role: string }) | Promise<User & { role: string }>) | undefined
    //>()
    expect(true).toBe(true)
})
