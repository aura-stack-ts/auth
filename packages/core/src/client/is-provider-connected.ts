import type { ClientContext } from "@/client/context.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@/@types/index.ts"

export const isProviderConnected = ({ client }: ClientContext) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
        try {
            const response = await client.get("/providers/:oauth", { params: { oauth } })
            const json = await response.json()
            return json?.success === true && json?.connected === true
        } catch (error) {
            console.error("Error checking provider connection:", error)
            return false
        }
    }
}
