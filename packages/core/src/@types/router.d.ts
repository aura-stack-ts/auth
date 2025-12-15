import { createOAuthIntegrations } from "@/oauth/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { CookieOptions } from "./index.ts"
import { createJoseInstance } from "@/jose.ts"

declare module "@aura-stack/router" {
    interface GlobalContext {
        oauth: ReturnType<typeof createOAuthIntegrations>
        cookies: CookieOptions
        jose: ReturnType<typeof createJoseInstance>
        basePath: string
        trustedProxyHeaders?: boolean
    }
}
