import { describe, expectTypeOf, test } from "vitest"
import { createAuth } from "@/createAuth"
import { zod, identitySchema } from "@aura-stack/react/identity/zod"
import type {
    RefreshUserInfoAPIReturn,
    Session,
    SignUpAPIOptions,
    User,
    Wrap,
    ZodIdentitySchema,
    ZodShapeToObject,
} from "@aura-stack/react/types"
import type {
    InferSignUp,
    InferSession,
    InferUser,
    NextUpdateSessionOptions,
    NextUpdateSessionReturn,
    NextSignUpReturn,
} from "@/@types"

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
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<Session<Identity> | null>()
        })

        test("api.updateSession", () => {
            expectTypeOf(api.updateSession).toEqualTypeOf<
                <Options extends NextUpdateSessionOptions<Identity>>(
                    options: Options
                ) => Promise<NextUpdateSessionReturn<Options, Identity>>
            >()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<SignUpAPIOptions<InferSignUp<typeof auth>>>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Options extends SignUpAPIOptions<InferSignUp<typeof auth>>>(
                    options: Options
                ) => Promise<NextSignUpReturn<Options>>
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
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<Session<Identity> | null>()
        })

        test("api.updateSession", () => {
            expectTypeOf(api.updateSession).toEqualTypeOf<
                <Options extends NextUpdateSessionOptions<Identity>>(
                    options: Options
                ) => Promise<NextUpdateSessionReturn<Options, Identity>>
            >()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<
                SignUpAPIOptions<{
                    nickname: string
                    email: string
                    password: string
                }>
            >()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Options extends SignUpAPIOptions<InferSignUp<typeof auth>>>(
                    options: Options
                ) => Promise<NextSignUpReturn<Options>>
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
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<Session<Identity> | null>()
        })

        test("api.updateSession", () => {
            expectTypeOf(api.updateSession).toEqualTypeOf<
                <Options extends NextUpdateSessionOptions<Identity>>(
                    options: Options
                ) => Promise<NextUpdateSessionReturn<Options, Identity>>
            >()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<
                SignUpAPIOptions<{
                    nickname: string
                    email: string
                    password: string
                }>
            >()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Options extends SignUpAPIOptions<InferSignUp<typeof auth>>>(
                    options: Options
                ) => Promise<NextSignUpReturn<Options>>
            >()
        })
    })
})
