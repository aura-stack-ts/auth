import { AuraAuthError } from "@/errors/aura-error.ts"
import type { UserEntity } from "@/@types/entities.ts"
import type { AuraErrorCode } from "@/errors/catalog.ts"

export const assertUserStatus = (
    user: UserEntity,
    { error = "ACCOUNT_INACTIVE", headers }: { error?: AuraErrorCode; headers?: Headers } = {}
) => {
    if (user.status === "deleted" || user.status === "suspended" || user.deletedAt) {
        throw new AuraAuthError({
            code: error,
            headers,
        })
    }
}
