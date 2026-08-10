import { describe, expectTypeOf, test } from "vitest"
import { createAuth } from "@/createAuth"
import { zod, identitySchema, type IdentityShape } from "@aura-stack/auth/identity/zod"
import type { FromShapeToObject, Identities, InferSession, InferUser } from "@/identity"
import type {
    DeepPartial,
    ReactRouterSignUpAPIOptions,
    ReactRouterSignUpReturn,
    ReactRouterUpdateSessionAPIOptions,
    ReactRouterUpdateSessionReturn,
    RefreshUserInfoAPIReturn,
    Session,
    User,
    Wrap,
    InferSignUp,
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
        type Identity = FromShapeToObject<IdentityShape & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>

        test("Infer Types", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<Wrap<Identity>>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<Wrap<Identity>>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{}>()
        })

        test("api.getSession", () => {
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<Session<Identity> | null>()
        })

        test("api.updateSession", () => {
            expectTypeOf<Parameters<typeof api.updateSession>[0]>().toEqualTypeOf<{
                session: DeepPartial<Session<Identity>>
                headers?: HeadersInit | undefined
                request: Request
                redirect?: boolean | undefined
                redirectTo?: string | undefined
                skipCSRFCheck?: boolean | undefined
                doubleSubmitToken?: string | undefined
            }>()
            expectTypeOf(api.updateSession).toEqualTypeOf<
                <Options extends ReactRouterUpdateSessionAPIOptions<Identity>>(
                    options: Options
                ) => Promise<ReactRouterUpdateSessionReturn<Options, Identity>>
            >()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<{
                payload: {}
                request: Request
                headers?: HeadersInit | undefined
                redirect?: boolean | undefined
                redirectTo?: string | undefined
                skipCSRFCheck?: boolean | undefined
                doubleSubmitToken?: string | undefined
            }>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Options extends ReactRouterSignUpAPIOptions<InferSignUp<typeof auth>>>(
                    options: Options
                ) => Promise<ReactRouterSignUpReturn<Options>>
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
            expectTypeOf<Awaited<ReturnType<typeof api.getSession>>>().toEqualTypeOf<Session<Identity> | null>()
        })

        test("api.updateSession", () => {
            expectTypeOf<Parameters<typeof api.updateSession>[0]>().toEqualTypeOf<{
                session: DeepPartial<Session<Identity>>
                headers?: HeadersInit | undefined
                request: Request
                redirect?: boolean | undefined
                redirectTo?: string | undefined
                skipCSRFCheck?: boolean | undefined
                doubleSubmitToken?: string | undefined
            }>()
            expectTypeOf(api.updateSession).toEqualTypeOf<
                <Options extends ReactRouterUpdateSessionAPIOptions<Identity>>(
                    options: Options
                ) => Promise<ReactRouterUpdateSessionReturn<Options, Identity>>
            >()
        })

        test("api.refreshUserInfo", () => {
            expectTypeOf<ReturnType<typeof api.refreshUserInfo>>().toEqualTypeOf<Promise<RefreshUserInfoAPIReturn<Identity>>>()
        })

        test("api.signUp", () => {
            expectTypeOf<Parameters<typeof api.signUp>[0]>().toEqualTypeOf<{
                payload: {
                    nickname: string
                    email: string
                    password: string
                }
                request: Request
                headers?: HeadersInit | undefined
                redirect?: boolean | undefined
                redirectTo?: string | undefined
                skipCSRFCheck?: boolean | undefined
                doubleSubmitToken?: string | undefined
            }>()
            expectTypeOf(api.signUp).toEqualTypeOf<
                <Options extends ReactRouterSignUpAPIOptions<InferSignUp<typeof auth>>>(
                    options: Options
                ) => Promise<ReactRouterSignUpReturn<Options>>
            >()
        })
    })
})
