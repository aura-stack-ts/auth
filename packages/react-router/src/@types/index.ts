import type { ReactRouterAPI } from "@/@types/api"
import type { AuthInstance } from "@aura-stack/react"
import type { FromShapeToObject, Identities } from "@aura-stack/react/identity"

export type * from "@/@types/api"
export type * from "@/@types/core"

/**
 * The ReactRouterInstance type represents the shape of the object returned by the `createAuth`
 * function in the React Router integration of Aura Auth. It was implemented due to errors related
 * to unportable types from the `createAuth.api` object.
 */
export interface ReactRouterInstance<Identity extends Identities = Identities> {
    api: ReactRouterAPI<FromShapeToObject<Identity>>
    core: AuthInstance<FromShapeToObject<Identity>>
    handlers: AuthInstance<FromShapeToObject<Identity>>["handlers"]
}
