import { createOAuthIntegrations } from "@/oauth/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { CookieOptions } from "./index.ts"

declare module "@aura-stack/router" {
    interface GlobalContext {
        oauth: ReturnType<typeof createOAuthIntegrations>
        cookies: CookieOptions
    }
}
