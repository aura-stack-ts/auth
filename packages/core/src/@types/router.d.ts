import { createJoseInstance } from "@/jose.ts"
import { createOAuthIntegrations, OAuthIntegrations } from "@/oauth/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { AuthConfig, CookieOptions } from "./index.ts"

declare module "@aura-stack/router" {
    interface GlobalContext extends Required<Omit<AuthConfig, "secret" | "oauth">> {
        oauth: ReturnType<typeof createOAuthIntegrations>
        jose: ReturnType<typeof createJoseInstance>
    }
}
