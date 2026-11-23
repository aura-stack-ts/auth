import { getEnv } from "@/shared/env.ts"
import { isBoolean, isString } from "@/shared/assert.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getUseSecureCookiesConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>({
    config,
    baseURL,
    proxyHeaders,
}: {
    config: AuthConfig<Identity, SignUpSchema> | undefined
    baseURL: string | undefined
    proxyHeaders: boolean
}) => {
    return isBoolean(config?.cookies?.useSecureCookies)
        ? config.cookies.useSecureCookies
            ? "trusted"
            : "untrusted"
        : proxyHeaders
          ? "dynamic"
          : isString(baseURL) && URL.canParse(baseURL)
            ? new URL(baseURL).protocol === "https:"
                ? "trusted"
                : "untrusted"
            : getEnv("NODE_ENV") === "test" || getEnv("NODE_ENV") === "development"
              ? "untrusted"
              : "trusted"
}
