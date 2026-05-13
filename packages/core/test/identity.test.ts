import { describe, test, expect, expectTypeOf } from "vitest"
import { createIdentity, InferUser, UserIdentity, UserIdentityArkType, UserIdentityValibot } from "@/shared/identity.ts"
import { z } from "zod/v4"
import * as valibot from "valibot"
import { createAuth } from "@/createAuth.ts"
import { createSchemaRegistry, deriveSchema } from "@/validator/registry.ts"
import { type } from "arktype"

describe("createIdentity", () => {
    test("should create a Zod schema when passed a Zod shape", () => {
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

    test("should create a Valibot schema when passed a Valibot shape", () => {
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

    test("should create an Arktype schema when passed an Arktype shape", () => {
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
})

describe("stripUnknownKeys", () => {
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

    const payload = {
        sub: "user123",
        name: "John Doe",
        role: "admin",
        extraKey: "should be stripped",
    }

    describe("zod schemas", () => {
        test("zod schema with 'strip' unknownKeys", () => {
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

        test("zod schema with 'passthrough' unknownKeys", () => {
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

        test("zod schema with 'strict' unknownKeys", () => {
            const schema = deriveSchema(zodSchema, "strict")
            expect(schema.safeParse(payload)).toMatchObject({
                success: false,
            })
        })
    })

    describe("valibot schemas", () => {
        test("valibot schema with 'strip' unknownKeys", () => {
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

        test("valibot schema with 'passthrough' unknownKeys", () => {
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

        test("valibot schema with 'strict' unknownKeys", () => {
            const schema = deriveSchema(valibotSchema, "strict")
            expect(valibot.safeParse(schema, payload)).toMatchObject({
                success: false,
            })
        })
    })

    describe("arktype schemas", () => {
        test("arktype schema with 'strip' unknownKeys", () => {
            const Schema = deriveSchema(arktypeSchema, "strip")

            const out = Schema(payload)
            expect(out).toMatchObject({
                sub: "user123",
                name: "John Doe",
                role: "admin",
            })
        })

        test("arktype schema with 'passthrough' unknownKeys", () => {
            const Schema = deriveSchema(arktypeSchema, "passthrough")
            const out = Schema(payload)
            expect(out).toMatchObject({
                sub: "user123",
                name: "John Doe",
                role: "admin",
                extraKey: "should be stripped",
            })
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
})
