import type { NextAPI } from "@/@types/api"
import type { zod } from "@/identity/zod"
import type { AuthInstance, Handlers, SchemaTypes, User } from "@aura-stack/react/types"

/** Public type surface for `@aura-stack/next` (re-exports React/auth types plus Next-specific helpers). */
export type * from "@/@types/core"
export type * from "@/@types/api"

export interface NextInstance<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>> {
    core: AuthInstance<DefaultUser, SignUpSchema>
    api: NextAPI<DefaultUser, SignUpSchema>
    handlers: Handlers
}

export type { InferUser, InferSession, InferSignUp } from "@/identity/index"
