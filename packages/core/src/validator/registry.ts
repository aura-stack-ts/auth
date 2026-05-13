import { formatZodError } from "@/shared/utils.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { IdentityConfig } from "@/@types/config.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import { createValidator } from "@/validator/validator.ts"
import { isArkType, isValibotSchema, isZodSchema } from "@/shared/assert.ts"
import { strictObject, partial, looseObject, type ObjectSchema, object } from "valibot"
import type { Type } from "arktype"
import type { ZodObject } from "zod/v4"

export const deriveSchema = <T extends ZodObject<any> | ObjectSchema<any, undefined> | Type<{}>>(
    schema: T,
    mode: "strip" | "passthrough" | "strict" | "partial" = "strip"
): any => {
    if (isZodSchema(schema)) {
        return mode === "strip"
            ? schema.strip()
            : mode === "passthrough"
              ? schema.loose()
              : mode === "strict"
                ? schema.strict()
                : schema.partial()
    }
    if (isValibotSchema(schema)) {
        return mode === "strip"
            ? object(schema.entries)
            : mode === "passthrough"
              ? looseObject(schema.entries)
              : mode === "strict"
                ? strictObject(schema.entries)
                : partial(schema as ObjectSchema<any, undefined>)
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

export const createSchemaRegistry = <Identity extends ZodObject<any> | ObjectSchema<any, undefined> | Type<{}>>(
    config: IdentityConfig<Identity>
) => {
    const schema = deriveSchema(config.schema ?? UserIdentity, config.unknownKeys)
    const partialSchema = deriveSchema(config.schema ?? UserIdentity, "partial")

    const validator = createValidator(schema)
    const partialValidator = createValidator(partialSchema)

    const parse = async (data: unknown = {}) => {
        const { data: output, success, error } = validator.validate(data)
        if (!success) {
            const details = JSON.stringify(isZodSchema(schema) ? formatZodError(error) : {}, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZodSchema(schema) ? error : undefined,
            })
        }
        return output
    }

    const parseAsPartial = async (data: unknown = {}) => {
        const { data: output, success, error } = partialValidator.validate(data)
        if (!success) {
            const details = JSON.stringify(isZodSchema(schema) ? formatZodError(error) : {}, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZodSchema(schema) ? error : undefined,
            })
        }
        return output
    }

    return { parse, parseAsPartial }
}
