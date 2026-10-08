import { describe, expectTypeOf, test } from "vitest"
import { type } from "arktype"
import * as valibot from "valibot"
import { Type as Typebox } from "typebox"
import { z, ZodOptional, ZodString } from "zod/v4"
import { createAuth } from "@/createAuth.ts"
import { identitySchema, zod } from "@/identity/zod.ts"
import { identitySchema as UserIdentity } from "@/identity/zod.ts"
import { identitySchema as UserIdentityArkType } from "@/identity/arktype.ts"
import { identitySchema as UserIdentityTypeBox } from "@/identity/typebox.ts"
import { identitySchema as UserIdentityValibot, type IdentityShape as UserShapeValibot } from "@/identity/valibot.ts"
import type { Session, User } from "@/index.ts"
import type { InferSession, InferUser, UserShape } from "@/identity/index.ts"
import type { JWTHeaderParameters, JWTVerifyOptions, Prettify } from "@aura-stack/jose"
import type { AuthInstance, TypedJWTPayload, ZodIdentitySchema } from "@/@types/index.ts"
import type { InferSignUp, ValibotShapeToObject, Wrap, ZodShapeToObject } from "@/@types/utility.ts"
import type {
    GetSessionAPIOptions,
    GetSessionAPIReturn,
    RefreshUserInfoAPIReturn,
    SignUpAPIOptions,
    SignUpAPIReturn,
    UpdateSessionAPIOptions,
    UpdateSessionAPIReturn,
} from "@/@types/api.ts"

describe("createAuth", () => {
    describe("with custom identity", async () => {
        const auth = createAuth({
            oauth: [],
            identity: {
                schema: identitySchema.extend({
                    role: zod.string(),
                    nickname: zod.string().optional(),
                }),
            },
        })
        const { api } = auth
        type Identity = ZodShapeToObject<ZodIdentitySchema & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>

        test("Infer Types", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<Wrap<Identity>>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<Wrap<Identity>>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{}>()
        })

        test("api.getSession", () => {
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<GetSessionAPIReturn<Identity>>()
        })

        test("api.updateSession", () => {
            expectTypeOf<Parameters<typeof api.updateSession>[0]>().toEqualTypeOf<UpdateSessionAPIOptions<Identity>>()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<SignUpAPIOptions<Record<string, any>>>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Payload extends Record<string, any> = InferSignUp<typeof auth>>(
                    options: SignUpAPIOptions<Payload>
                ) => Promise<SignUpAPIReturn>
            >()
        })
    })

    describe("with sign up schema", () => {
        const auth = createAuth({
            oauth: [],
            signUp: {
                schema: zod.object({
                    nickname: zod.string(),
                    email: zod.email(),
                    password: zod.string().min(8),
                }),
                onCreateUser: () => null,
            },
        })
        const { api } = auth
        type Identity = ZodShapeToObject<ZodIdentitySchema>

        test("InferUser", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<User>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<User>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{
                nickname: string
                email: string
                password: string
            }>()
        })

        test("api.getSession", () => {
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<GetSessionAPIReturn<Identity>>()
        })

        test("api.updateSession", () => {
            expectTypeOf<Parameters<typeof api.updateSession>[0]>().toEqualTypeOf<UpdateSessionAPIOptions<Identity>>()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<SignUpAPIOptions<Record<string, any>>>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Payload extends Record<string, any> = InferSignUp<typeof auth>>(
                    options: SignUpAPIOptions<Payload>
                ) => Promise<SignUpAPIReturn>
            >()
        })
    })

    describe("with custom identity and sign up schema", () => {
        const auth = createAuth({
            oauth: [],
            identity: {
                schema: identitySchema.extend({
                    role: zod.string(),
                    nickname: zod.string().optional(),
                }),
            },
            signUp: {
                schema: zod.object({
                    nickname: zod.string(),
                    email: zod.email(),
                    password: zod.string().min(8),
                }),
                onCreateUser: () => null,
            },
        })
        const { api } = auth
        type Identity = ZodShapeToObject<ZodIdentitySchema & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>

        test("InferUser", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<Wrap<Identity>>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<Wrap<Identity>>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{
                nickname: string
                email: string
                password: string
            }>()
        })

        test("api.getSession", () => {
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<GetSessionAPIReturn<Identity>>()
        })

        test("api.updateSession", () => {
            expectTypeOf<Parameters<typeof api.updateSession>[0]>().toEqualTypeOf<UpdateSessionAPIOptions<Identity>>()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<SignUpAPIOptions<Record<string, any>>>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Payload extends Record<string, any> = InferSignUp<typeof auth>>(
                    options: SignUpAPIOptions<Payload>
                ) => Promise<SignUpAPIReturn>
            >()
        })
    })

    expectTypeOf(createAuth({ oauth: [] }).api.getSession).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<GetSessionAPIReturn<ZodShapeToObject<UserShape>>>
    >()
    expectTypeOf(createAuth({ oauth: [] }).api.updateSession).toEqualTypeOf<
        (options: UpdateSessionAPIOptions<User>) => Promise<UpdateSessionAPIReturn<ZodShapeToObject<UserShape>>>
    >()

    expectTypeOf(createAuth({ oauth: [] }).jose.signJWS).toEqualTypeOf<
        (payload: TypedJWTPayload<Partial<ZodShapeToObject<UserShape>>>, options?: JWTHeaderParameters) => Promise<string>
    >()
    expectTypeOf(createAuth({ oauth: [] }).jose.verifyJWS).toEqualTypeOf<
        (token: string, options?: JWTVerifyOptions) => Promise<TypedJWTPayload<ZodShapeToObject<UserShape>>>
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
        createAuth({
            oauth: [],
            identity: { schema: UserIdentityArkType.and({ role: "string?" }) },
        }).jose.signJWS
    ).toEqualTypeOf<
        (
            payload: TypedJWTPayload<
                Partial<
                    {
                        sub: string
                        role?: string | undefined
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
            identity: {
                schema: Typebox.Object({
                    ...UserIdentityTypeBox.properties,
                    role: Typebox.Optional(Typebox.String()),
                }),
            },
        }).jose.signJWS
    ).toEqualTypeOf<
        (
            payload: TypedJWTPayload<
                Partial<
                    {
                        sub: string
                        role?: Typebox.TOptional<Typebox.TString>
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
        createAuth({ oauth: [], identity: { schema: UserIdentityArkType.and({ role: "string?" }) } }).api.getSession
    ).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<
            GetSessionAPIReturn<{
                role?: string | undefined
                sub: string
                name?: string | null | undefined
                image?: string | null | undefined
                email?: string | null | undefined
            }>
        >
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            identity: { schema: Typebox.Object({ ...UserIdentityTypeBox.properties, role: Typebox.Optional(Typebox.String()) }) },
        }).api.getSession
    ).toEqualTypeOf<
        (options: GetSessionAPIOptions) => Promise<
            GetSessionAPIReturn<{
                role: Typebox.TOptional<Typebox.TString>
                sub: string
                name?: string | null | undefined
                image?: string | null | undefined
                email?: string | null | undefined
            }>
        >
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

    expectTypeOf(
        createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () => null,
            },
        }).api.signUp
    ).toEqualTypeOf<<Payload extends Record<string, any> = {}>(options: SignUpAPIOptions<Payload>) => Promise<SignUpAPIReturn>>()
    expectTypeOf(
        createAuth({
            oauth: [],
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string().min(8),
                }),
                onCreateUser: () => null,
            },
        }).api.signUp
    ).toEqualTypeOf<
        <Payload extends Record<string, any> = { name: string; lastName: string; email: string; password: string }>(
            options: SignUpAPIOptions<Payload>
        ) => Promise<SignUpAPIReturn>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            signUp: {
                schema: valibot.object({
                    name: valibot.string(),
                    lastName: valibot.string(),
                    email: valibot.pipe(valibot.string(), valibot.email()),
                    password: valibot.pipe(valibot.string(), valibot.minLength(8)),
                }),
                onCreateUser: () => null,
            },
        }).api.signUp
    ).toEqualTypeOf<
        <Payload extends Record<string, any> = { name: string; lastName: string; email: string; password: string }>(
            options: SignUpAPIOptions<Payload>
        ) => Promise<SignUpAPIReturn>
    >()
    expectTypeOf(
        createAuth({
            oauth: [],
            signUp: {
                schema: type({
                    name: "string",
                    lastName: "string",
                    email: "string",
                    password: "string",
                }),
                onCreateUser: () => null,
            },
        }).api.signUp
    ).toEqualTypeOf<
        <Payload extends Record<string, any> = { name: string; lastName: string; email: string; password: string }>(
            options: SignUpAPIOptions<Payload>
        ) => Promise<SignUpAPIReturn>
    >()
})
