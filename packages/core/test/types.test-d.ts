import { describe, expectTypeOf } from "vitest"
import { z, ZodString } from "zod/v4"
import { createAuth } from "@/createAuth.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { github, type GitHubProfile } from "@/oauth/github.ts"
import type {
    GetSessionAPIOptions,
    GetSessionAPIReturn,
    UpdateSessionAPIOptions,
    UpdateSessionAPIReturn,
    UserShape,
} from "@/@types/session.ts"
import type { AuthConfig, AuthInstance, User } from "@/index.ts"
import type { OAuthProviderCredentials } from "@/@types/oauth.ts"
import type { EditableShape, ShapeToObject } from "@/@types/utility.ts"
import type { JWTHeaderParameters, JWTVerifyOptions, TypedJWTPayload } from "@aura-stack/jose"

describe("createAuth", () => {
    expectTypeOf(createAuth).toEqualTypeOf<
        <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => AuthInstance<ShapeToObject<Identity>>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.getSession).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<GetSessionAPIReturn<ShapeToObject<UserShape>>>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.updateSession).toEqualTypeOf<
        (options: UpdateSessionAPIOptions<User>) => Promise<UpdateSessionAPIReturn<ShapeToObject<UserShape>>>
    >()

    expectTypeOf(createAuth({ oauth: [] }).jose.signJWS).toEqualTypeOf<
        (payload: TypedJWTPayload<Partial<User>>, options?: JWTHeaderParameters) => Promise<string>
    >()
    expectTypeOf(createAuth({ oauth: [] }).jose.verifyJWS).toEqualTypeOf<
        (token: string, options?: JWTVerifyOptions) => Promise<TypedJWTPayload<ShapeToObject<UserShape>>>
    >()

    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).jose.signJWS
    ).toEqualTypeOf<
        (
            payload: TypedJWTPayload<
                Partial<
                    {
                        sub: string
                        role: string
                        name?: string | null | undefined
                        image?: string | null | undefined
                        email?: string | null | undefined
                    } & {
                        sub: string
                        name?: string | null | undefined
                        image?: string | null | undefined
                        email?: string | null | undefined
                    }
                >
            >,
            options?: JWTHeaderParameters
        ) => Promise<string>
    >()
    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).jose.verifyJWS
    ).toEqualTypeOf<
        (token: string, options?: JWTVerifyOptions) => Promise<TypedJWTPayload<ShapeToObject<UserShape & { role: ZodString }>>>
    >()

    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.getSession
    ).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<GetSessionAPIReturn<ShapeToObject<UserShape & { role: ZodString }>>>
    >()
    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.updateSession
    ).toEqualTypeOf<
        (
            options: UpdateSessionAPIOptions<ShapeToObject<UserShape & { role: ZodString }>>
        ) => Promise<UpdateSessionAPIReturn<ShapeToObject<UserShape & { role: ZodString }>>>
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
