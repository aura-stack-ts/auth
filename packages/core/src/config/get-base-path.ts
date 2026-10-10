import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getBasePathConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    const basePath = config?.basePath?.replace(/^\/+/, "/").replace(/\/+$/, "") ?? "/auth"
    if (!basePath.startsWith("/")) {
        throw new AuraAuthError({ code: "INVALID_BASE_PATH_CONFIG" })
    }
    return basePath
}
