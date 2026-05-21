import { z, type ZodObject } from "zod/v4"
import { formatZodError } from "@/shared/utils.ts"
import { UserIdentity, type SchemaTypes } from "@/shared/identity.ts"
import { IdentityConfig } from "@/@types/config.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import { createValidator } from "@/validator/validator.ts"
import { isArkType, isValibotSchema, isZodSchema } from "@/shared/assert.ts"
import * as valibot from "valibot"
import { type, type Type } from "arktype"

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
    throw new AuthValidationError(
        "INVALID_IDENTITY_VALIDATION_FAILED",
        `Unsupported schema mode configuration. Valid options are: "strip", "passthrough", "strict" and "partial".`
    )
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

export const getFullSchema = <Schema extends SchemaTypes>(schema: Schema): any => {
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
    return z.object({
        user: schema,
        expires: z.coerce.date().optional(),
    })
}

export const createSchemaRegistry = <Identity extends ZodObject<any> | valibot.ObjectSchema<any, undefined> | Type<{}>>(
    config: IdentityConfig<Identity>
) => {
    const schema = deriveSchema(config.schema ?? UserIdentity, config.unknownKeys)
    const schemaAsPartial = deriveSchema(config.schema ?? UserIdentity, "partial")
    const schemaWithJWT = deriveSchemaWithJWT(config.schema ?? UserIdentity)

    const validator = createValidator(schema)
    const partialValidator = createValidator(schemaAsPartial)
    const jwtValidator = createValidator(schemaWithJWT)

    const parse = async (data: unknown = {}): Promise<any> => {
        const { data: output, success, error } = validator.validate(data)
        if (!success) {
            let errorDetails = {}
            if (isZodSchema(schema)) {
                errorDetails = formatZodError(error)
            } else if (isValibotSchema(schema)) {
                errorDetails = { issues: error }
            } else if (isArkType(schema)) {
                errorDetails = { error }
            }
            const details = JSON.stringify(errorDetails, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZodSchema(schema) ? error : undefined,
            })
        }
        return output
    }

    const parseAsPartial = async (data: unknown = {}): Promise<any> => {
        const { data: output, success, error } = partialValidator.validate(data)
        if (!success) {
            let errorDetails = {}
            if (isZodSchema(schema)) {
                errorDetails = formatZodError(error)
            } else if (isValibotSchema(schema)) {
                errorDetails = { issues: error }
            } else if (isArkType(schema)) {
                errorDetails = { error }
            }
            const details = JSON.stringify(errorDetails, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZodSchema(schemaAsPartial) ? error : undefined,
            })
        }
        return output
    }

    const parseWithJWT = async (data: unknown = {}): Promise<any> => {
        const { data: output, success, error } = jwtValidator.validate(data)
        if (!success) {
            let errorDetails = {}
            if (isZodSchema(schemaWithJWT)) {
                errorDetails = formatZodError(error)
            } else if (isValibotSchema(schemaWithJWT)) {
                errorDetails = { issues: error }
            } else if (isArkType(schemaWithJWT)) {
                errorDetails = { error }
            }
            const details = JSON.stringify(errorDetails, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZodSchema(schemaWithJWT) ? error : undefined,
            })
        }
        return output
    }

    return { parse, parseAsPartial, parseWithJWT, schema, schemaAsPartial, schemaWithJWT }
}
