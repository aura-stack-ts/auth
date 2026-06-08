import { type AuthConfig, createAuth as createAuthInstance } from "@aura-stack/auth"
import type { Identities } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends Identities>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)
    return auth
}
