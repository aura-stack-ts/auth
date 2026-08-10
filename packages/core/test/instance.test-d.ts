import { describe, expectTypeOf, test } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { identitySchema, zod, type IdentityShape } from "@/identity/zod.ts"
import type { Session, User } from "@/index.ts"
import type { InferSignUp, Wrap } from "@/@types/utility.ts"
import type { FromShapeToObject, Identities, InferSession, InferUser } from "@/identity/index.ts"
import type {
    GetSessionAPIReturn,
    RefreshUserInfoAPIReturn,
    SignUpAPIOptions,
    SignUpAPIReturn,
    UpdateSessionAPIOptions,
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
        type Identity = FromShapeToObject<IdentityShape & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>

        test("Infer Types", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<Wrap<InferUser<typeof auth>>>()
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

    describe("with custom identity and sign up schema", () => {
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
        type Identity = FromShapeToObject<Identities>

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
})
