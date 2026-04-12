import { api } from "@/lib/api"
import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import type { AuthConfig } from "@aura-stack/react"
import type { EditableShape, ShapeToObject, UserShape } from "@aura-stack/react/types"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)
    return {
        /**
         * The core auth instance. It can be used to advanced use cases, such as creating custom behaviors.
         * For most use cases, the `api` property should be sufficient, as it provides a higher-level API for common authentication tasks.
         */
        core: auth,
        api: api<ShapeToObject<Identity>>(auth),
    }
}
