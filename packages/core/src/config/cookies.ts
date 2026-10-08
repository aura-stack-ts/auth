import { createCookieStore } from "@/shared/http/cookie.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { InternalLogger } from "@/@types/internal.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const cookies = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined,
    logger: InternalLogger | undefined
) => {
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const unsecureCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)

    return {
        trusted: secureCookieStore,
        untrusted: unsecureCookieStore,
    }
}
