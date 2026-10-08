import { getEnv } from "@/shared/env.ts"
import { isFalsy } from "@/shared/assert.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"

export const setDynamicParams = <const T extends string, P extends Record<string, unknown>>(
    template: T,
    params: P,
    id: string
): string => {
    return template.replace(/(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g, (_, prefix, key) => {
        const value = getEnv(`${id.replace("-", "_").toUpperCase()}_${key}`) ?? params[key]
        if (isFalsy(value)) {
            throw new AuraAuthError({
                code: "OIDC_INVALID_ISSUER_PARAMS",
                userMessage: `The "${id}" identity provider configuration is invalid. Please check issuer settings and try again.`,
            })
        }
        return `${prefix}${encodeURIComponent(String(value))}`
    })
}

export const setSearchParams = (url: URL, params: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
            url.searchParams.set(key, value)
        }
    }
}
