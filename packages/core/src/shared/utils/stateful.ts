import { AuraAuthError } from "@/errors/aura-error.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type { UserEntity } from "@/@types/entities.ts"
import type { AuraErrorCode } from "@/errors/catalog.ts"
import type { InternalCookieStoreConfig } from "@/@types/internal.ts"

export const assertUserStatus = (
    user: UserEntity,
    { error = "ACCOUNT_INACTIVE", cookieStore }: { error?: AuraErrorCode; cookieStore?: InternalCookieStoreConfig } = {}
) => {
    if (user.status === "deleted" || user.status === "suspended" || user.deletedAt) {
        const manager = createCookieManager(() => cookieStore!)
        throw new AuraAuthError({
            code: error,
            headers: manager.clear(),
        })
    }
}
