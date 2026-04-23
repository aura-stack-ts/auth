import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import { api } from "@/lib/api"
import type { AuthConfig } from "@aura-stack/react"
import type { ZodShapeToObject, EditableShape, UserShape } from "@aura-stack/react/identity"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance(config)
    return {
        core: auth,
        api: api<ZodShapeToObject<Identity>>(auth),
    }
}
