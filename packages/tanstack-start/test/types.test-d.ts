import { describe, expectTypeOf } from "vitest"
import { createAuth } from "@/createAuth"
import { zod, identitySchema, type IdentityShape } from "@aura-stack/react/identity/zod"
import type { FromShapeToObject } from "@/identity"
import type { DeepPartial, Session } from "@/@types"

describe("createAuth", () => {
    describe("with custom identity", () => {
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

        expectTypeOf<Awaited<ReturnType<typeof auth.api.getSession>>>().toEqualTypeOf<FromShapeToObject<Identity> | null>()

        expectTypeOf<Parameters<typeof auth.api.updateSession>[0]["data"]["session"]>().toEqualTypeOf<{
            user?: DeepPartial<Identity>
            expires?: string | undefined
        }>()
        expectTypeOf<Awaited<ReturnType<typeof auth.api.updateSession>>>().toEqualTypeOf<{
            success: boolean
            redirect: boolean
            redirectURL: string | null
        }>()

        expectTypeOf<Awaited<ReturnType<typeof auth.api.refreshUserInfo>>>().toEqualTypeOf<{
            success: boolean
            session: Session<FromShapeToObject<Identity>> | null
        }>()

        expectTypeOf<Parameters<typeof auth.api.signUp>[0]["data"]["payload"]>().toEqualTypeOf<{}>()
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

        expectTypeOf<Parameters<typeof auth.api.signUp>[0]["data"]["payload"]>().toEqualTypeOf<{
            nickname: string
            email: string
            password: string
        }>()
    })
})
