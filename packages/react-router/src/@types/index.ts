import { zod } from "@aura-stack/react/identity/zod"
import type { ReactRouterAPI } from "@/@types/api"
import type { SchemaTypes } from "@aura-stack/react/identity"
import type { Handlers, AuthInstance, User, Prettify, Wrap, RemoveIndexSignature, InferSchema } from "@aura-stack/react/types"

export type * from "@/@types/api"
export type * from "@/@types/core"

/**
 * The ReactRouterInstance type represents the shape of the object returned by the `createAuth`
 * function in the React Router integration of Aura Auth. It was implemented due to errors related
 * to unportable types from the `createAuth.api` object.
 */
export interface ReactRouterInstance<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>> {
    api: ReactRouterAPI<DefaultUser, SignUpSchema>
    core: AuthInstance<DefaultUser, SignUpSchema>
    handlers: Handlers
}

export type InferSignUp<T extends ReactRouterInstance> =
    T extends ReactRouterInstance<any, infer SignUpSchema>
        ? Prettify<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>
        : never
