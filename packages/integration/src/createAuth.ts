import { AuthConfig, createAuth as createAuthInstance, EditableShape, UserShape } from "@aura-stack/auth"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)
    return auth
}
