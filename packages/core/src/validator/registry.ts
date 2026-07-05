import { z } from "zod/v4"
import * as valibot from "valibot"
import { type } from "arktype"
import { IsObject, Type as Typebox } from "typebox"
import { UserIdentity, type Identities, type SchemaTypes } from "@/shared/identity.ts"
import { isArkType, isValibotSchema, isZodSchema } from "@/shared/assert.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { createValidator } from "@aura-stack/router/validator"
import type { IdentityConfig } from "@/@types/config.ts"
import type { EditableToSchema, ReturnUpdateSessionShape } from "@/@types/utility.ts"
import { OAuthTokenPayloadSchema } from "@/schemas.ts"
import type { OAuthTokenPayload } from "@/@types/session.ts"

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

export const deriveSchemaWithJWT = <Schema extends SchemaTypes>(schema: Schema): any => {
    if (isValibotSchema(schema)) {
        return valibot.object({
            ...schema.entries,
            exp: valibot.number(),
            iat: valibot.number(),
            jti: valibot.string(),
            nbf: valibot.number(),
            aud: valibot.optional(valibot.string()),
            iss: valibot.optional(valibot.string()),
            mexp: valibot.optional(valibot.number()),
        })
    }
    if (isArkType(schema)) {
        return schema.and({
            exp: "number",
            iat: "number",
            jti: "string",
            nbf: "number",
            aud: "string?",
            iss: "string?",
            mexp: "number?",
        })
    }
    if (IsObject(schema)) {
        return Typebox.Object(
            {
                ...schema.properties,
                exp: Typebox.Number(),
                iat: Typebox.Number(),
                jti: Typebox.String(),
                nbf: Typebox.Number(),
                aud: Typebox.Optional(Typebox.String()),
                iss: Typebox.Optional(Typebox.String()),
                mexp: Typebox.Optional(Typebox.Number()),
            },
            {
                ...schema,
            }
        )
    }
    if (isZodSchema(schema)) {
        return schema.extend({
            exp: z.number(),
            iat: z.number(),
            jti: z.string(),
            nbf: z.number(),
            aud: z.string().optional(),
            iss: z.string().optional(),
            mexp: z.number().optional(),
        })
    }
    throw new AuraAuthError({ code: "SCHEMA_UNSUPPORTED" })
}

export const getFullSchema = <Identity extends Identities, Schema = EditableToSchema<Identity>>(
    schema: Schema
): ReturnUpdateSessionShape<Schema> => {
    if (isValibotSchema(schema)) {
        // @ts-ignore Deep type instantiation with external schemas
        return valibot.object({
            // @ts-ignore ArkType schema property type mismatch
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

export const createSchemaRegistry = <Identity extends SchemaTypes>(config: IdentityConfig<Identity>) => {
    const schema = deriveSchema(config.schema ?? UserIdentity, config.unknownKeys)
    const schemaAsPartial = deriveSchema(config.schema ?? UserIdentity, "partial")
    const schemaWithJWT = deriveSchemaWithJWT(config.schema ?? UserIdentity)
    const oauthTokens = deriveSchema(OAuthTokenPayloadSchema)

    const validator = createValidator(schema)
    const partialValidator = createValidator(schemaAsPartial)
    const jwtValidator = createValidator(schemaWithJWT)
    const oauthTokensValidator = createValidator(oauthTokens)

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

    const parseWithJWT = async (data: unknown = {}): Promise<any> => {
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
        return output as unknown as OAuthTokenPayload
    }

    return { parse, parseAsPartial, parseWithJWT, parseOAuthTokens, schema, schemaAsPartial, schemaWithJWT }
}
