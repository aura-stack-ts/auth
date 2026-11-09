import { getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@/@types/index.ts"

export const disconnectProvider = (client: InternalAuthClient) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
        try {
            const csrfToken = await getCSRFToken(client)
            const response = await client.delete("/providers/:oauth", {
                params: { oauth },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await response.json()
            return json?.success === true
        } catch (error) {
            console.error("Error disconnecting provider:", error)
            return false
        }
    }
}
