import { describe, test, expect, expectTypeOf, vi, afterEach } from "vitest"
import {
    createIdentity,
    InferUser,
    UserIdentity,
    UserIdentityArkType,
    UserIdentityTypeBox,
    UserIdentityValibot,
} from "@/shared/identity.ts"
import { z } from "zod/v4"
import * as valibot from "valibot"
import { createAuth } from "@/createAuth.ts"
import { createSchemaRegistry, deriveSchema } from "@/validator/registry.ts"
import { ArkErrors, type } from "arktype"
import { Static, Type as Typebox } from "typebox"
import { Value } from "typebox/value"

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("createIdentity", () => {
    test("createIdentity with Zod schema", () => {
        const schema = createIdentity({
            sub: z.string(),
            name: z.string().nullable().optional(),
            email: z.string().nullable().optional(),
            image: z.string().nullable().optional(),
            role: z.string(),
        })

        const out = schema.parse({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })

        expect(out).toEqual({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })
    })

    test("auth instance with Zod schema", () => {
        const schema = createIdentity({
            sub: z.string(),
            name: z.string().nullable().optional(),
            email: z.string().nullable().optional(),
            image: z.string().nullable().optional(),
            role: z.string(),
        })

        const auth = createAuth({
            oauth: [],
            identity: {
                schema,
            },
        })
        type ExpectedIdentity = z.infer<typeof schema>
        expectTypeOf<ExpectedIdentity>().toEqualTypeOf<InferUser<typeof auth>>()
    })

    test("createIdentity with Valibot schema", () => {
        const schema = createIdentity({
            sub: valibot.string(),
            name: valibot.optional(valibot.nullable(valibot.string())),
            email: valibot.optional(valibot.nullable(valibot.pipe(valibot.string(), valibot.email()))),
            image: valibot.optional(valibot.nullable(valibot.string())),
            role: valibot.string(),
        })

        const out = valibot.parse(schema, {
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })

        expect(out).toEqual({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })
    })

    test("auth instance with Valibot schema", () => {
        const schema = createIdentity({
            sub: valibot.string(),
            name: valibot.optional(valibot.nullable(valibot.string())),
            email: valibot.optional(valibot.nullable(valibot.pipe(valibot.string(), valibot.email()))),
            image: valibot.optional(valibot.nullable(valibot.string())),
            role: valibot.string(),
        })

        const auth = createAuth({
            oauth: [],
            identity: {
                schema,
            },
        })
        type ExpectedIdentity = valibot.InferOutput<typeof schema>
        expectTypeOf<ExpectedIdentity>().toEqualTypeOf<InferUser<typeof auth>>()
    })

    test("createIdentity with Arktype schema", () => {
        const Schema = createIdentity(
            type({
                sub: "string",
                name: "string | null?",
                email: "string | null?",
                image: "string | null?",
                role: "string",
            })
        )

        type User = typeof Schema.infer

        const out = Schema({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        }) as User

        expect({
            sub: out.sub,
            name: out.name,
            role: out.role,
        }).toEqual({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })
    })

    test("auth instance with Arktype schema", () => {
        const Schema = createIdentity(
            type({
                sub: "string",
                name: "string | null?",
                email: "string | null?",
                image: "string | null?",
                role: "string",
            })
        )

        const auth = createAuth({
            oauth: [],
            identity: {
                schema: Schema,
            },
        })
        type ExpectedIdentity = Exclude<ReturnType<typeof Schema>, ArkErrors>
        expectTypeOf<ExpectedIdentity>().toEqualTypeOf<InferUser<typeof auth>>()
    })

    test("createIdentity with TypeBox schema", () => {
        const Schema = createIdentity({
            sub: Typebox.String(),
            name: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
            email: Typebox.Optional(Typebox.Union([Typebox.String({ format: "email" }), Typebox.Null()])),
            image: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
            role: Typebox.String(),
        })

        const out = Value.Parse(Schema, {
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })

        expect(out).toEqual({
            sub: "user123",
            name: "John Doe",
            role: "admin",
        })
    })

    test("auth instance with TypeBox schema", () => {
        const Schema = createIdentity({
            sub: Typebox.String(),
            name: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
            email: Typebox.Optional(Typebox.Union([Typebox.String({ format: "email" }), Typebox.Null()])),
            image: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
            role: Typebox.String(),
            user: Typebox.Object({
                id: Typebox.String(),
                name: Typebox.String(),
            }),
        })

        type ExpectedIdentity = Static<typeof Schema>
        createAuth({
            oauth: [],
            identity: {
                schema: Schema,
            },
        })
        expectTypeOf<ExpectedIdentity>().toEqualTypeOf<{
            sub: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
            user: {
                id: string
                name: string
            }
        }>()
    })
})

describe("deriveSchema", () => {
    const zodSchema = UserIdentity.extend({
        role: z.string(),
    })

    const valibotSchema = valibot.object({
        ...UserIdentityValibot.entries,
        role: valibot.string(),
    })

    const arktypeSchema = UserIdentityArkType.and({
        role: "string",
    })

    const typeboxSchema = Typebox.Object({
        ...UserIdentityTypeBox.properties,
        role: Typebox.String(),
    })

    const payload = {
        sub: "user123",
        name: "John Doe",
        role: "admin",
        extraKey: "should be stripped",
    }

    describe("zod schemas", () => {
        test("zod schema with 'strip' deriveSchema", () => {
            const schema = deriveSchema(zodSchema, "strip")
            expect(schema.safeParse(payload)).toMatchObject({
                success: true,
                data: {
                    sub: "user123",
                    name: "John Doe",
                    role: "admin",
                },
            })
        })

        test("zod schema with 'passthrough' deriveSchema", () => {
            const schema = deriveSchema(zodSchema, "passthrough")
            expect(schema.safeParse(payload)).toMatchObject({
                success: true,
                data: {
                    sub: "user123",
                    name: "John Doe",
                    role: "admin",
                    extraKey: "should be stripped",
                },
            })
        })

        test("zod schema with 'strict' deriveSchema", () => {
            const schema = deriveSchema(zodSchema, "strict")
            expect(schema.safeParse(payload)).toMatchObject({
                success: false,
            })
        })

        test("zod schema with 'partial' deriveSchema", () => {
            const schema = deriveSchema(zodSchema, "partial")
            expect(schema.safeParse({})).toMatchObject({
                success: true,
            })
        })
    })

    describe("valibot schemas", () => {
        test("valibot schema with 'strip' deriveSchema", () => {
            const schema = deriveSchema(valibotSchema, "strip")
            expect(valibot.safeParse(schema, payload)).toMatchObject({
                success: true,
                output: {
                    sub: "user123",
                    name: "John Doe",
                    role: "admin",
                },
            })
        })

        test("valibot schema with 'passthrough' deriveSchema", () => {
            const schema = deriveSchema(valibotSchema, "passthrough")
            expect(valibot.safeParse(schema, payload)).toMatchObject({
                success: true,
                output: {
                    sub: "user123",
                    name: "John Doe",
                    role: "admin",
                    extraKey: "should be stripped",
                },
            })
        })

        test("valibot schema with 'strict' deriveSchema", () => {
            const schema = deriveSchema(valibotSchema, "strict")
            expect(valibot.safeParse(schema, payload)).toMatchObject({
                success: false,
            })
        })

        test("valibot schema with 'partial' deriveSchema", () => {
            const schema = deriveSchema(valibotSchema, "partial")
            expect(valibot.safeParse(schema, {})).toMatchObject({
                success: true,
            })
        })
    })

    describe("arktype schemas", () => {
        test("arktype schema with 'strip' deriveSchema", () => {
            const Schema = deriveSchema(arktypeSchema, "strip")

            const out = Schema(payload)
            expect(out).toMatchObject({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("arktype schema with 'passthrough' deriveSchema", () => {
            const Schema = deriveSchema(arktypeSchema, "passthrough")
            const out = Schema(payload)
            expect(out).toMatchObject({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("arktype schema with 'strict' deriveSchema", () => {
            const Schema = deriveSchema(arktypeSchema, "strict")
            const out = Schema(payload)
            expect(out).toMatchObject({})
        })

        test("arktype schema with 'partial' deriveSchema", () => {
            const Schema = deriveSchema(arktypeSchema, "partial")
            const out = Schema({})
            expect(out).toMatchObject({})
        })
    })

    describe("typebox schemas", () => {
        test("typebox schema with 'strip' deriveSchema", () => {
            const Schema = deriveSchema(typeboxSchema, "strip")

            const out = Value.Parse(Schema, Value.Clean(Schema, { ...payload }))
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("typebox schema with 'passthrough' deriveSchema", () => {
            const Schema = deriveSchema(typeboxSchema, "passthrough")
            const out = Value.Parse(Schema, payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("typebox schema with 'strict' deriveSchema", () => {
            const Schema = deriveSchema(typeboxSchema, "strict")
            const isValid = Value.Check(Schema, payload)
            expect(isValid).toBe(false)
        })

        test("typebox schema with 'partial' deriveSchema", () => {
            const Schema = deriveSchema(typeboxSchema, "partial")
            const out = Value.Parse(Schema, {})
            expect(out).toEqual({})
        })
    })
})

describe("createSchemaRegistry", () => {
    const zodSchema = UserIdentity.extend({
        role: z.string(),
    })

    const valibotSchema = valibot.object({
        ...UserIdentityValibot.entries,
        role: valibot.string(),
    })

    const arktypeSchema = UserIdentityArkType.and({
        role: "string",
    })

    const typeboxSchema = Typebox.Object({
        ...UserIdentityTypeBox.properties,
        role: Typebox.String(),
    })

    const payload = {
        sub: "user123",
        name: "John Doe",
        role: "admin",
        extraKey: "should be stripped",
    }

    describe("zod schemas", () => {
        test("zod schema with 'strip' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: zodSchema,
                unknownKeys: "strip",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("zod schema with 'passthrough' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: zodSchema,
                unknownKeys: "passthrough",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("zod schema with 'strict' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: zodSchema,
                unknownKeys: "strict",
            })
            await expect(parse(payload)).rejects.toThrow()
        })
    })

    describe("valibot schemas", () => {
        test("valibot schema with 'strip' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: valibotSchema,
                unknownKeys: "strip",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("valibot schema with 'passthrough' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: valibotSchema,
                unknownKeys: "passthrough",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("valibot schema with 'strict' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: valibotSchema,
                unknownKeys: "strict",
            })
            await expect(parse(payload)).rejects.toThrow()
        })
    })

    describe("arktype schemas", () => {
        test("arktype schema with 'strip' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: arktypeSchema,
                unknownKeys: "strip",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("arktype schema with 'passthrough' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: arktypeSchema,
                unknownKeys: "passthrough",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("arktype schema with 'strict' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: arktypeSchema,
                unknownKeys: "strict",
            })
            await expect(parse(payload)).rejects.toThrow()
        })
    })

    describe("typebox schemas", () => {
        test("typebox schema with 'strip' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: typeboxSchema,
                unknownKeys: "strip",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("typebox schema with 'passthrough' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: typeboxSchema,
                unknownKeys: "passthrough",
            })
            const out = await parse(payload)
            expect(out).toEqual({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
        })

        test("typebox schema with 'strict' unknownKeys", async () => {
            const { parse } = createSchemaRegistry({
                schema: typeboxSchema,
                unknownKeys: "strict",
            })
            await expect(parse(payload)).rejects.toThrow()
        })
    })
})
