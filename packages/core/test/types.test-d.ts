import { describe, expectTypeOf } from "vitest"
import { z } from "zod"
import { createAuth } from "@/createAuth.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { github, type GitHubProfile } from "@/oauth/github.ts"
import { JWTHeaderParameters, JWTVerifyOptions, TypedJWTPayload } from "@aura-stack/jose"
import type { AuthConfig, AuthInstance, OAuthProviderCredentials, User } from "@/index.ts"
import type {
    GetSessionAPIOptions,
    SessionResponse,
    UpdateSessionAPIOptions,
    UpdateSessionReturn,
    UserShape,
} from "@/@types/session.ts"
import type { EditableShape, Prettify, ShapeToObject } from "@/@types/utility.ts"

describe("createAuth", () => {
    expectTypeOf(createAuth).toEqualTypeOf<
        <Identity extends EditableShape<UserShape>, Plain = ShapeToObject<Identity>>(
            config: AuthConfig<Identity>
        ) => AuthInstance<Plain & User>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.getSession).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<
            SessionResponse<
                Prettify<{
                    sub: unknown
                    name: unknown
                    image: unknown
                    email: unknown
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.updateSession).toEqualTypeOf<
        (options: UpdateSessionAPIOptions<User>) => Promise<
            UpdateSessionReturn<
                Prettify<{
                    sub: unknown
                    name: unknown
                    image: unknown
                    email: unknown
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
    >()

    expectTypeOf(createAuth({ oauth: [] }).jose.signJWS).toEqualTypeOf<
        (payload: TypedJWTPayload<Partial<User>>, options?: JWTHeaderParameters) => Promise<string>
    >()
    expectTypeOf(createAuth({ oauth: [] }).jose.verifyJWS).toEqualTypeOf<
        (
            token: string,
            options?: JWTVerifyOptions
        ) => Promise<
            TypedJWTPayload<
                Prettify<{
                    sub: unknown
                    name: unknown
                    image: unknown
                    email: unknown
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
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
        (
            token: string,
            options?: JWTVerifyOptions
        ) => Promise<
            TypedJWTPayload<
                Prettify<{
                    sub: string
                    name: string | null | undefined
                    image: string | null | undefined
                    email: string | null | undefined
                    role: string
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
    >()

    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.getSession
    ).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<
            SessionResponse<
                Prettify<{
                    sub: string
                    role: string
                    name: string | null | undefined
                    image: string | null | undefined
                    email: string | null | undefined
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
    >()
    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.updateSession
    ).toEqualTypeOf<
        (
            options: UpdateSessionAPIOptions<
                Prettify<{
                    sub: string
                    role: string
                    name: string | null | undefined
                    image: string | null | undefined
                    email: string | null | undefined
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        ) => Promise<
            UpdateSessionReturn<
                Prettify<{
                    sub: string
                    role: string
                    name: string | null | undefined
                    image: string | null | undefined
                    email: string | null | undefined
                }> & {
                    sub: string
                    name?: string | null | undefined
                    image?: string | null | undefined
                    email?: string | null | undefined
                }
            >
        >
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
