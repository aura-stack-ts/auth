import { infer as Infer, type ZodObject } from "zod"
import { formatZodError } from "@/shared/utils.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import type { IdentityConfig } from "@/@types/config.ts"

export const stripUnknownKeys = <T extends ZodObject<any>>(schema: T, unknownKeys: "strip" | "passthrough" | "strict") => {
    switch (unknownKeys) {
        case "strip":
            return schema.strip()
        case "passthrough":
            return schema.loose()
        case "strict":
            return schema.strict()
    }
}

export const createSchemaRegistry = <Identity extends ZodObject<any>>(config: IdentityConfig<Identity>) => {
    const schema = stripUnknownKeys(config.schema ?? UserIdentity, config.unknownKeys ?? "strip")

    const parse = async <T = Infer<typeof schema>>(data: unknown = {}) => {
        const parsed = await schema.safeParseAsync(data)
        if (!parsed.success) {
            const details = JSON.stringify(formatZodError(parsed.error), null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: parsed.error,
            })
        }
        return parsed.data as T
    }

    const parseAsPartial = async <T = Partial<Infer<typeof schema>>>(data: unknown = {}) => {
        const parsed = await schema.partial().safeParseAsync(data)
        if (!parsed.success) {
            const details = JSON.stringify(formatZodError(parsed.error), null, 2)
            throw new AuthValidationError("INVALID_IDENTITY_VALIDATION_FAILED", details, {
                cause: parsed.error,
            })
        }
        return parsed.data as T
    }

    return { parse, parseAsPartial }
}
