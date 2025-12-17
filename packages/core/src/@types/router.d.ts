import { createJoseInstance } from "@/jose.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { AuthConfig, JoseInstance } from "./index.ts"

declare module "@aura-stack/router" {
    interface GlobalContext extends Required<Omit<AuthConfig, "secret" | "oauth">> {
        oauth: ReturnType<typeof createBuiltInOAuthProviders>
        jose: JoseInstance
    }
}
