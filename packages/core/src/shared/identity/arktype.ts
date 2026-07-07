import { type } from "arktype"
import type { Identities } from "@/shared/identity/index.ts"
import type { EditableShapeArkType } from "@/@types/utility.ts"

export * as arktype from "arktype"

export const identitySchema = type({
    sub: "string",
    name: "string | null?",
    image: "string | null?",
    email: "string.email | null?",
})

export type IdentityShape = typeof identitySchema
export type IsArkType<T extends Identities> = T extends EditableShapeArkType<IdentityShape> ? true : false
