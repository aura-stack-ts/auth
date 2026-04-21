import { AuthConfig, createAuth as createAuthInstance } from "@aura-stack/auth"
import type { EditableShape, UserShape } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)
    return auth
}
