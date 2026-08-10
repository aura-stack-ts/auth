import { describe, expectTypeOf, test } from "vitest"
import { createAuth } from "@/pages/createAuth"
import { zod, identitySchema, type IdentityShape } from "@aura-stack/auth/identity/zod"
import type { FromShapeToObject } from "@aura-stack/auth/identity"
import type { Session, User, Wrap } from "@aura-stack/auth/types"
import type { InferSignUp, InferSession, InferUser } from "@/@types"

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
        type Identity = FromShapeToObject<IdentityShape & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>

        test("Infer Types", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<Wrap<Identity>>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<Wrap<Identity>>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{}>()
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
        test("InferUser", () => {
            expectTypeOf<InferUser<typeof auth>>().toEqualTypeOf<User>()
            expectTypeOf<InferSession<typeof auth>>().toEqualTypeOf<Session<User>>()
            expectTypeOf<InferSignUp<typeof auth>>().toEqualTypeOf<{
                nickname: string
                email: string
                password: string
            }>()
        })
    })
})
