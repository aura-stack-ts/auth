import { describe, expectTypeOf } from "vitest"
import * as valibot from "valibot"
import { createAuth } from "@/createAuth.ts"
import { z, ZodOptional, ZodString } from "zod/v4"
import { Identities, UserIdentity, UserIdentityValibot, UserShapeValibot } from "@/shared/identity.ts"
import { github, type GitHubProfile } from "@/oauth/github.ts"
import type {
    GetSessionAPIOptions,
    GetSessionAPIReturn,
    Session,
    UpdateSessionAPIOptions,
    UpdateSessionAPIReturn,
    UserShape,
} from "@/@types/index.ts"
import type { AuthConfig, AuthInstance, User } from "@/index.ts"
import type { OAuthProviderCredentials } from "@/@types/oauth.ts"
import type { FromShapeToObject, InferSession, InferUser, ValibotShapeToObject, ZodShapeToObject } from "@/@types/utility.ts"
import type { JWTHeaderParameters, JWTVerifyOptions, Prettify, TypedJWTPayload } from "@aura-stack/jose"

type Shapes = ZodShapeToObject<UserShape> | ValibotShapeToObject<UserShapeValibot>

describe("createAuth", () => {
    expectTypeOf(createAuth).toEqualTypeOf<
        <Identity extends Identities>(config: AuthConfig<Identity>) => AuthInstance<FromShapeToObject<Identity>>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.getSession).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<GetSessionAPIReturn<Shapes>>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.updateSession).toEqualTypeOf<
        (options: UpdateSessionAPIOptions<User>) => Promise<UpdateSessionAPIReturn<Shapes>>
    >()

    expectTypeOf(createAuth({ oauth: [] }).jose.signJWS).toEqualTypeOf<
        (payload: TypedJWTPayload<Partial<Shapes>>, options?: JWTHeaderParameters) => Promise<string>
    >()
    expectTypeOf(createAuth({ oauth: [] }).jose.verifyJWS).toEqualTypeOf<
        (token: string, options?: JWTVerifyOptions) => Promise<TypedJWTPayload<Shapes>>
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
        createAuth({
            oauth: [],
            identity: { schema: valibot.object({ ...UserIdentityValibot.entries, role: valibot.string() }) },
        }).jose.signJWS
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
        (token: string, options?: JWTVerifyOptions) => Promise<TypedJWTPayload<ZodShapeToObject<UserShape & { role: ZodString }>>>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            identity: { schema: valibot.object({ ...UserIdentityValibot.entries, role: valibot.string() }) },
        }).jose.verifyJWS
    ).toEqualTypeOf<
        (
            token: string,
            options?: JWTVerifyOptions
        ) => Promise<TypedJWTPayload<ValibotShapeToObject<UserShapeValibot & { role: valibot.StringSchema<undefined> }>>>
    >()
    expectTypeOf(createAuth({ oauth: [], identity: { schema: UserIdentityValibot } })).toEqualTypeOf<
        AuthInstance<ValibotShapeToObject<UserShapeValibot>>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            identity: {
                schema: valibot.object({
                    ...UserIdentityValibot.entries,
                    role: valibot.string(),
                }),
            },
        })
    ).toEqualTypeOf<AuthInstance<User & { role: string }>>()

    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.getSession
    ).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<GetSessionAPIReturn<ZodShapeToObject<UserShape & { role: ZodString }>>>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            identity: { schema: valibot.object({ ...UserIdentityValibot.entries, role: valibot.string() }) },
        }).api.getSession
    ).toEqualTypeOf<
        (
            options: GetSessionAPIOptions
        ) => Promise<GetSessionAPIReturn<ValibotShapeToObject<UserShapeValibot & { role: valibot.StringSchema<undefined> }>>>
    >()
    expectTypeOf(
        createAuth({ oauth: [], identity: { schema: UserIdentity.extend({ role: z.string() }) } }).api.updateSession
    ).toEqualTypeOf<
        (
            options: UpdateSessionAPIOptions<ZodShapeToObject<UserShape & { role: ZodString }>>
        ) => Promise<UpdateSessionAPIReturn<ZodShapeToObject<UserShape & { role: ZodString }>>>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            identity: { schema: valibot.object({ ...UserIdentityValibot.entries, role: valibot.string() }) },
        }).api.updateSession
    ).toEqualTypeOf<
        (
            options: UpdateSessionAPIOptions<ValibotShapeToObject<UserShapeValibot & { role: valibot.StringSchema<undefined> }>>
        ) => Promise<UpdateSessionAPIReturn<ValibotShapeToObject<UserShapeValibot & { role: valibot.StringSchema<undefined> }>>>
    >()

    expectTypeOf<InferUser<ReturnType<typeof createAuth>>>().toEqualTypeOf<User>()
    expectTypeOf<InferUser<ReturnType<typeof createAuth<UserShape & { role: ZodOptional<ZodString> }>>>>().toEqualTypeOf<
        Prettify<User & { role?: string | undefined }>
    >()
    expectTypeOf<
        InferUser<
            ReturnType<
                typeof createAuth<UserShapeValibot & { role: valibot.OptionalSchema<valibot.StringSchema<undefined>, undefined> }>
            >
        >
    >().toEqualTypeOf<Prettify<User & { role?: string | undefined }>>()

    expectTypeOf<InferSession<ReturnType<typeof createAuth<UserShape & { role: ZodOptional<ZodString> }>>>>().toEqualTypeOf<
        Session<Prettify<User & { role?: string | undefined }>>
    >()
    expectTypeOf<
        InferSession<
            ReturnType<
                typeof createAuth<UserShapeValibot & { role: valibot.OptionalSchema<valibot.StringSchema<undefined>, undefined> }>
            >
        >
    >().toEqualTypeOf<Session<Prettify<User & { role?: string | undefined }>>>()
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
