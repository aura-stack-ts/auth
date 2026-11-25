import { isAuraAuthError, type AuraErrorOptions } from "@/shared/errors/aura-error.ts"

export const toRethrowError = (error: unknown, overrides: Partial<AuraErrorOptions>) => {
    if (isAuraAuthError(error)) {
        throw Object.assign(error, overrides)
    }
}
