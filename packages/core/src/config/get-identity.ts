import { createSchemaRegistry } from "@/validator/registry.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getIdentityConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    const unknownKeys = config?.identity?.unknownKeys ?? "strip"
    const skipValidation = config?.identity?.skipValidation ?? false

    const schemaRegistry = createSchemaRegistry({
        schema: config?.identity?.schema,
        unknownKeys,
        skipValidation,
    })
    return {
        schemaRegistry,
        unknownKeys,
        skipValidation,
    }
}
