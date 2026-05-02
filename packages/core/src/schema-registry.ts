import { isZodSchema } from "@/shared/assert.ts"
import { formatZodError } from "@/shared/utils.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import { strictObject, objectWithRest, transform, pipe, unknown, safeParseAsync, partial, type ObjectSchema } from "valibot"
import type { ZodObject } from "zod/v4"
import type { IdentityConfig } from "@/@types/config.ts"

export const stripUnknownKeys = <T extends ZodObject<any> | ObjectSchema<any, undefined>>(
    schema: T,
    unknownKeys: "strip" | "passthrough" | "strict"
): any => {
    switch (unknownKeys) {
        case "strip":
            return isZodSchema(schema)
                ? schema.strip()
                : pipe(
                      objectWithRest((schema as ObjectSchema<any, undefined>).entries, unknown()),
                      transform((input) => {
                          const result: any = {}
                          for (const key in (schema as ObjectSchema<any, undefined>).entries) {
                              if (key in input) result[key] = input[key]
                          }
                          return result
                      })
                  )
        case "passthrough":
            return isZodSchema(schema)
                ? schema.loose()
                : objectWithRest((schema as ObjectSchema<any, undefined>).entries, unknown())
        case "strict":
            return isZodSchema(schema) ? schema.strict() : strictObject((schema as ObjectSchema<any, undefined>).entries)
        default:
            throw new AuthValidationError(
                "INVALID_IDENTITY_VALIDATION_FAILED",
                `Invalid unknownKeys configuration: ${unknownKeys}. Valid options are: "strip", "passthrough", "strict".`
            )
    }
}

export const createSchemaRegistry = <Identity extends ZodObject<any> | ObjectSchema<any, any>>(
    config: IdentityConfig<Identity>
) => {
    const schema = stripUnknownKeys(config.schema ?? UserIdentity, config.unknownKeys ?? "strip")
    const partialSchema = isZodSchema(schema) ? schema.partial() : partial(schema)

    const parse = async (data: unknown = {}) => {
        const isZod = isZodSchema(schema)
        const parsed: any = isZod ? await schema.safeParseAsync(data) : await safeParseAsync(schema as any, data)
        if (!parsed.success) {
            const details = JSON.stringify(isZod ? formatZodError(parsed.error) : {}, null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: isZod ? parsed.error : undefined,
            })
        }
        return isZod ? parsed.data : parsed.output
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
