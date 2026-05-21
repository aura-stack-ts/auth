/**
 * This file will be replaced by `validator/registry.ts`
 *
 */
import { isArkType, isValibotSchema, isZodSchema } from "@/shared/assert.ts"
import { formatZodError } from "@/shared/utils.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import { strictObject, objectWithRest, transform, pipe, unknown, safeParseAsync, partial, type ObjectSchema } from "valibot"
import type { Type } from "arktype"
import type { ZodObject } from "zod/v4"
import type { IdentityConfig } from "@/@types/config.ts"

export const stripUnknownKeys = <T extends ZodObject<any> | ObjectSchema<any, undefined> | Type>(
    schema: T,
    unknownKeys: "strip" | "passthrough" | "strict"
): any => {
    switch (unknownKeys) {
        case "strip":
            return isZodSchema(schema)
                ? schema.strip()
                : isValibotSchema(schema)
                  ? pipe(
                        objectWithRest((schema as ObjectSchema<any, undefined>).entries, unknown()),
                        transform((input) => {
                            const result: any = {}
                            for (const key in (schema as ObjectSchema<any, undefined>).entries) {
                                if (key in input) result[key] = input[key]
                            }
                            return result
                        })
                    )
                  : isArkType(schema)
                    ? schema.onUndeclaredKey("delete")
                    : undefined
        case "passthrough":
            return isZodSchema(schema)
                ? schema.loose()
                : isValibotSchema(schema)
                  ? objectWithRest((schema as ObjectSchema<any, undefined>).entries, unknown())
                  : isArkType(schema)
                    ? schema.onUndeclaredKey("ignore")
                    : undefined
        case "strict":
            return isZodSchema(schema)
                ? schema.strict()
                : isValibotSchema(schema)
                  ? strictObject((schema as ObjectSchema<any, undefined>).entries)
                  : isArkType(schema)
                    ? schema.onUndeclaredKey("reject")
                    : undefined
        default:
            throw new AuthValidationError(
                "INVALID_IDENTITY_VALIDATION_FAILED",
                `Invalid unknownKeys configuration: ${unknownKeys}. Valid options are: "strip", "passthrough", "strict".`
            )
    }
}

export const createSchemaRegistry = <Identity extends ZodObject<any> | ObjectSchema<any, any> | Type>(
    config: IdentityConfig<Identity & any>
) => {
    const schema = stripUnknownKeys(config.schema ?? UserIdentity, config.unknownKeys ?? "strip")
    const partialSchema = isZodSchema(schema)
        ? schema.partial()
        : isValibotSchema(schema)
          ? partial(schema as ObjectSchema<any, undefined>)
          : isArkType(schema)
            ? schema.partial()
            : undefined

    const parse = async (data: unknown = {}) => {
        const isZod = isZodSchema(schema)
        const parsed: any = isZod
            ? await schema.safeParseAsync(data)
            : isValibotSchema(schema)
              ? await safeParseAsync(schema as any, data)
              : isArkType(schema)
                ? schema(data)
                : undefined
        if ((!isArkType(schema) && !parsed.success) || (isArkType(schema) && !schema?.allows(data))) {
            const details = JSON.stringify(isZod ? formatZodError(parsed.error) : {}, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZod ? parsed.error : isArkType(schema) ? parsed.errors : undefined,
            })
        }
        return isZod ? parsed.data : isValibotSchema(schema) ? parsed.output : isArkType(schema) ? parsed : undefined
    }

    const parseAsPartial = async (data: unknown = {}) => {
        const isZod = isZodSchema(partialSchema)
        const parsed: any = isZod ? await partialSchema.safeParseAsync(data) : await safeParseAsync(partialSchema as any, data)
        if (!parsed.success) {
            const details = JSON.stringify(isZod ? formatZodError(parsed.error) : {}, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZod ? parsed.error : undefined,
            })
        }
        return isZod ? parsed.data : parsed.output
    }

    return { parse, parseAsPartial }
}
