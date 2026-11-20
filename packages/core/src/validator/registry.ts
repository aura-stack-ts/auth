import * as valibot from "valibot"
import { z } from "zod/v4"
import { type } from "arktype"
import { IsObject, Type as Typebox } from "typebox"
import { identitySchema } from "@/identity/zod.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { createValidator } from "@aura-stack/router/validator"
import { OAuthTokenPayloadSchema } from "@/shared/schemas/general.ts"
import { isArkType, isValibotSchema, isZodSchema } from "@/shared/assert.ts"
import type { OAuthTokenPayload } from "@/@types/session.ts"
import type { EditableToSchema } from "@/@types/identity.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { InternalIdentityConfig, ReturnUpdateSessionShape } from "@/@types/internal.ts"

export const deriveSchema = <Schema extends SchemaTypes>(
    schema: Schema,
    mode: "strip" | "passthrough" | "strict" | "partial" = "strip"
): any => {
    if (isZodSchema(schema)) {
        return mode === "strip"
            ? schema.strip()
            : mode === "passthrough"
              ? z.looseObject(schema.shape)
              : mode === "strict"
                ? schema.strict()
                : schema.partial().optional()
    }
    if (isValibotSchema(schema)) {
        return mode === "strip"
            ? valibot.object(schema.entries)
            : mode === "passthrough"
              ? valibot.looseObject(schema.entries)
              : mode === "strict"
                ? valibot.strictObject(schema.entries)
                : valibot.partial(schema as valibot.ObjectSchema<any, undefined>)
    }
    if (isArkType(schema)) {
        return mode === "strip"
            ? schema.onUndeclaredKey("delete")
            : mode === "passthrough"
              ? schema.onUndeclaredKey("ignore")
              : mode === "strict"
                ? schema.onUndeclaredKey("reject")
                : schema.partial()
    }
    if (IsObject(schema)) {
        return mode === "strip"
            ? Typebox.Object(schema.properties, {
                  ...schema,
                  additionalProperties: false,
                  strip: true,
              })
            : mode === "passthrough"
              ? Typebox.Object(schema.properties, {
                    ...schema,
                    additionalProperties: true,
                })
              : mode === "strict"
                ? Typebox.Object(schema.properties, {
                      ...schema,
                      additionalProperties: false,
                  })
                : Typebox.Partial(schema)
    }
    throw new AuraAuthError({ code: "SCHEMA_UNSUPPORTED" })
}

export const getFullSchema = <Identity extends Identities, Schema = EditableToSchema<Identity>>(
    schema: Schema
): ReturnUpdateSessionShape<Schema> => {
    if (isValibotSchema(schema)) {
        // @ts-ignore Deep type instantiation with external schemas
        return valibot.object({
            user: schema,
            expires: valibot.optional(
                valibot.pipe(
                    valibot.string(),
                    valibot.transform((input) => new Date(input)),
                    valibot.date()
                )
            ),
        })
    }
    if (isArkType(schema)) {
        // @ts-ignore Deep type instantiation with external schemas
        return type({
            // @ts-ignore ArkType schema property type mismatch
            user: schema,
            expires: type("string")
                .pipe((input) => new Date(input))
                .optional(),
        })
    }
    if (IsObject(schema)) {
        return Typebox.Object({
            user: schema,
            expires: Typebox.Optional(Typebox.String()),
        }) as unknown as ReturnUpdateSessionShape<Schema>
    }
    if (isZodSchema(schema)) {
        return z.object({
            user: schema,
            expires: z.coerce.date().optional(),
        }) as unknown as ReturnUpdateSessionShape<Schema>
    }
    throw new AuraAuthError({ code: "SCHEMA_UNSUPPORTED" })
}

const jwtClaims = z.object({
    exp: z.number(),
    iat: z.number(),
    nbf: z.number(),
    jti: z.string(),
    mexp: z.number().optional(),
})

export const createSchemaRegistry = <Identity extends SchemaTypes>(config: InternalIdentityConfig<Identity>) => {
    const schema = deriveSchema(config?.schema ?? identitySchema, config.unknownKeys)
    const schemaAsPartial = deriveSchema(config?.schema ?? identitySchema, "partial")
    const oauthTokens = deriveSchema(OAuthTokenPayloadSchema)

    const validator = createValidator(schema)
    const partialValidator = createValidator(schemaAsPartial)
    const jwtValidator = createValidator<z.output<typeof jwtClaims>>(jwtClaims)
    const oauthTokensValidator = createValidator<OAuthTokenPayload>(oauthTokens)

    const expiresAt = createValidator<string>(z.coerce.date().optional())

    const parse = async (data: unknown = {}): Promise<any> => {
        const { data: output, success, error } = validator.validate(data)
        if (!success) {
            throw new AuraAuthError({ code: "SCHEMA_PARSER_FAILED", cause: error })
        }
        return output
    }

    const parseAsPartial = async (data: unknown = {}): Promise<any> => {
        const { data: output, success, error } = partialValidator.validate(data)
        if (!success) {
            throw new AuraAuthError({ code: "SCHEMA_PARSER_FAILED", cause: error })
        }
        return output
    }

    const parseWithJWT = async (data: unknown = {}) => {
        const { data: output, success, error } = jwtValidator.validate(data)
        if (!success) {
            throw new AuraAuthError({ code: "SCHEMA_PARSER_FAILED", cause: error })
        }
        return output
    }

    const parseOAuthTokens = async (data: unknown = {}): Promise<OAuthTokenPayload> => {
        const { data: output, success, error } = oauthTokensValidator.validate(data)
        if (!success) {
            throw new AuraAuthError({ code: "SCHEMA_PARSER_FAILED", cause: error })
        }
        return output
    }

    const parseExpiresAt = async (expires: unknown): Promise<string> => {
        const { data: output, success, error } = expiresAt.validate(expires)
        if (!success) {
            throw new AuraAuthError({ code: "SCHEMA_PARSER_FAILED", cause: error })
        }
        return output
    }

    return { parse, parseAsPartial, parseWithJWT, parseOAuthTokens, parseExpiresAt, schema, schemaAsPartial }
}
