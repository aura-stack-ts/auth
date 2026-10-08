import { describe, expectTypeOf, test } from "vitest"
import { createAuth } from "@/createAuth"
import { zod, identitySchema } from "@aura-stack/auth/identity/zod"
import type {
    Session,
    User,
    Wrap,
    UpdateSessionAPIOptions,
    GetSessionAPIReturn,
    RefreshUserInfoAPIReturn,
    SignUpAPIOptions,
    SignUpAPIReturn,
    ZodShapeToObject,
    ZodIdentitySchema,
} from "@aura-stack/auth/types"
import type { InferSignUp } from "@/@types/index"
import type { InferSession, InferUser } from "@aura-stack/auth/identity"

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

        test("Infer Types", () => {
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
})
